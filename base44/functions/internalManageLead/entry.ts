import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id, action, notes, partner_id, target_lead_id, severity } = await req.json();
    const now = new Date().toISOString();
    const runtimeRuleMatches = [];

    const requireNotes = ['escalate', 'flag_circumvention', 'merge', 'release'];
    const restrictedByOwnership = ['assign', 'merge'];

    if (!lead_id || !action) {
      return Response.json({ error: 'lead_id and action are required' }, { status: 400 });
    }

    const lead = await base44.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const protectedUntil = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const actionMap = {
      lock: {
        updates: {
          ownership_status: 'locked',
          protected_until: protectedUntil,
        },
        event_type: 'lead_locked',
        summary: 'Internal ops locked the lead.'
      },
      release: {
        updates: {
          ownership_status: 'released',
          protected_until: null,
          is_circumvention_flagged: false,
        },
        event_type: 'lead_released',
        summary: 'Internal ops released the lead.'
      },
      flag_circumvention: {
        updates: {
          is_circumvention_flagged: true,
          ownership_status: 'protected',
          protected_until: protectedUntil,
        },
        event_type: 'circumvention_flagged',
        summary: 'Internal ops flagged circumvention risk.'
      },
      assign: {
        updates: {
          assigned_partner_id: partner_id || lead.assigned_partner_id,
          ownership_status: 'soft_owned',
          status: 'assigned',
          current_stage: 'assigned'
        },
        event_type: 'lead_assigned',
        summary: 'Internal ops assigned the lead.'
      },
      mark_duplicate: {
        updates: {
          is_duplicate_candidate: true
        },
        event_type: 'lead_marked_duplicate',
        summary: 'Internal ops marked the lead as duplicate candidate.'
      },
      escalate: {
        updates: {
          priority: 'critical',
          ownership_status: lead.ownership_status === 'unowned' ? 'soft_owned' : lead.ownership_status
        },
        event_type: 'lead_escalated',
        summary: 'Internal ops escalated the lead.'
      },
      merge: {
        updates: {
          status: 'merged',
          current_stage: 'merged',
          merged_into_lead_id: target_lead_id
        },
        event_type: 'lead_merged',
        summary: 'Internal ops merged the lead.'
      }
    };

    const selected = actionMap[action];
    if (!selected) {
      return Response.json({ error: 'Unsupported action' }, { status: 400 });
    }

    if (action === 'assign' && !partner_id) {
      return Response.json({ error: 'partner_id is required for assign' }, { status: 400 });
    }

    if (action === 'merge' && !target_lead_id) {
      return Response.json({ error: 'target_lead_id is required for merge' }, { status: 400 });
    }

    if (requireNotes.includes(action) && !notes?.trim()) {
      return Response.json({ error: 'notes are required for this action' }, { status: 400 });
    }

    if (restrictedByOwnership.includes(action) && lead.ownership_status === 'protected' && action !== 'merge') {
      return Response.json({ error: 'Lead is protected and cannot be reassigned without release' }, { status: 400 });
    }

    if (action === 'merge') {
      const targetLead = await base44.entities.Lead.get(target_lead_id);
      if (!targetLead || targetLead.id === lead_id) {
        return Response.json({ error: 'Select a valid duplicate target lead' }, { status: 400 });
      }
    }

    if (lead.is_private_inventory) {
      runtimeRuleMatches.push({ rule: 'private_inventory_priority', matched: true, result: 'protected_handling' });
    }
    if (lead.is_high_value || ['hnw', 'critical'].includes(lead.priority || '')) {
      runtimeRuleMatches.push({ rule: 'high_value_escalation', matched: true, result: 'ownership_lock' });
    }

    const updatedLead = await base44.entities.Lead.update(lead_id, selected.updates);

    if (action === 'lock' || action === 'flag_circumvention') {
      await base44.entities.LeadProtectionWindow.create({
        lead_id,
        locked_at: now,
        protected_until: updatedLead.protected_until,
        status: action === 'lock' ? 'active' : 'overridden',
        lock_reason: notes || selected.summary,
        overridden_by: action === 'flag_circumvention' ? user.id : undefined,
        override_reason: action === 'flag_circumvention' ? (notes || 'Circumvention review opened') : undefined,
      });
    }

    if (action === 'release') {
      const windows = await base44.entities.LeadProtectionWindow.filter({ lead_id });
      await Promise.all(windows.filter((item) => item.status === 'active').map((item) => base44.entities.LeadProtectionWindow.update(item.id, {
        status: 'released',
        override_reason: notes || 'Protection released by internal ops',
        overridden_by: user.id,
      })));

      const alerts = await base44.entities.CircumventionAlert.filter({ lead_id });
      await Promise.all(alerts.filter((item) => ['open', 'reviewing', 'awaiting_partner_response', 'escalated'].includes(item.status)).map((item) => base44.entities.CircumventionAlert.update(item.id, {
        status: 'resolved',
        resolution_notes: notes || 'Resolved during release',
        resolved_by: user.id,
        resolved_date: now,
      })));
    }

    if (action === 'assign' && partner_id) {
      await base44.entities.LeadAssignment.create({
        lead_id,
        assignment_type: 'override',
        partner_id,
        assigned_at: now,
        assignment_status: 'pending',
        assignment_reason: notes || 'Internal assignment',
        assigned_by: user.id,
        sla_due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      });
    }

    if (action === 'flag_circumvention') {
      await base44.entities.CircumventionAlert.create({
        lead_id,
        partner_id: lead.assigned_partner_id,
        alert_type: 'bypass_risk',
        severity: severity || 'high',
        summary: notes || 'Circumvention risk detected by internal ops.',
        evidence_json: { lead_id, source: lead.source, ownership_status: lead.ownership_status, evidence_note: notes || '', opened_at: now },
        status: 'reviewing',
        opened_by: user.id,
        assigned_reviewer_id: user.id,
      });
    }

    if (action === 'merge' && target_lead_id) {
      await base44.entities.LeadMergeLog.create({
        source_lead_id: lead_id,
        target_lead_id,
        merge_reason: notes || 'Internal merge',
        merged_by: user.id,
        merge_confidence: 0.9,
      });

      await base44.entities.Lead.update(target_lead_id, {
        is_duplicate_candidate: false,
        notes_summary: [lead.notes_summary, 'Merged duplicate reviewed by internal ops'].filter(Boolean).join(' · ')
      });

      await base44.entities.LeadRuleEvaluation.create({
        lead_id,
        rule_id: 'duplicate_merge_review',
        trigger_event: action,
        matched: true,
        evaluation_payload_json: { source_lead_id: lead_id, target_lead_id },
        result_payload_json: { result: 'merged_after_review', target_lead_id }
      });

      await base44.entities.Lead.update(lead_id, {
        is_duplicate_candidate: false
      });
    }

    await Promise.all(runtimeRuleMatches.map((item) => base44.entities.LeadRuleEvaluation.create({
      lead_id,
      rule_id: item.rule,
      trigger_event: action,
      matched: item.matched,
      evaluation_payload_json: { source: lead.source, priority: lead.priority, is_private_inventory: lead.is_private_inventory, is_high_value: lead.is_high_value },
      result_payload_json: { result: item.result }
    })));

    const event = await base44.entities.LeadEvent.create({
      lead_id,
      event_type: selected.event_type,
      actor_type: 'internal',
      actor_user_id: user.id,
      summary: selected.summary,
      reason: notes || '',
      event_payload_json: { action, notes: notes || '', partner_id: partner_id || '', target_lead_id: target_lead_id || '' },
      immutable: true,
    });

    await base44.entities.Notification.create({
      title: selected.summary,
      body: `${updatedLead.lead_code || updatedLead.id} was updated by internal ops.`,
      lead_id,
      channel: 'in_app',
      status: 'queued'
    });

    const audit = await base44.entities.AuditLog.create({
      organisation_id: lead.organisation_id,
      entity_name: 'Lead',
      entity_id: lead_id,
      action,
      actor_id: user.id,
      summary: selected.summary,
      immutable: true,
      scope: 'lead',
      metadata: { notes: notes || '', partner_id: partner_id || '', target_lead_id: target_lead_id || '' }
    });

    return Response.json({ lead: updatedLead, event, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});