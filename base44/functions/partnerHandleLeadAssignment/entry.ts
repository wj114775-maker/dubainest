import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id, assignment_id, action, notes, outcome, scheduled_at } = await req.json();
    const noteRequiredActions = ['reject', 'request_reassignment', 'mark_lost', 'mark_invalid', 'log_contact_attempt', 'log_viewing_completed'];

    if (!lead_id || !assignment_id || !action) {
      return Response.json({ error: 'lead_id, assignment_id and action are required' }, { status: 400 });
    }

    const [lead, assignment, partnerProfiles] = await Promise.all([
      base44.entities.Lead.get(lead_id),
      base44.entities.LeadAssignment.get(assignment_id),
      base44.entities.PartnerUserProfile.filter({ user_id: user.id })
    ]);

    if (!lead || !assignment) {
      return Response.json({ error: 'Lead assignment not found' }, { status: 404 });
    }

    const partnerAgencyId = partnerProfiles[0]?.partner_agency_id;
    if (!partnerAgencyId || assignment.partner_id !== partnerAgencyId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const parsedSchedule = scheduled_at ? new Date(scheduled_at).toISOString() : now;
    const protectedUntil = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    const slaStatus = assignment.sla_due_at && new Date(assignment.sla_due_at) < new Date() ? 'breached' : 'on_track';
    const actionMap = {
      accept: {
        assignment_updates: { assignment_status: 'accepted', accepted_at: now, rejected_at: assignment.rejected_at },
        lead_updates: { status: 'accepted', current_stage: 'accepted', ownership_status: 'locked', assigned_partner_id: partnerAgencyId, protected_until: protectedUntil },
        event_type: 'partner_assignment_accepted',
        summary: 'Partner accepted lead assignment.'
      },
      reject: {
        assignment_updates: { assignment_status: 'rejected', accepted_at: assignment.accepted_at, rejected_at: now },
        lead_updates: { status: 'qualified', current_stage: 'qualified', ownership_status: 'released', assigned_partner_id: null },
        event_type: 'partner_assignment_rejected',
        summary: 'Partner rejected lead assignment.'
      },
      request_reassignment: {
        assignment_updates: { assignment_status: 'reassigned', rejected_at: now, assignment_reason: notes || 'Partner requested reassignment' },
        lead_updates: { status: 'assigned', current_stage: 'assigned', ownership_status: 'released', assigned_partner_id: null },
        event_type: 'partner_reassignment_requested',
        summary: 'Partner requested reassignment.'
      },
      mark_won: {
        assignment_updates: { assignment_status: 'accepted', accepted_at: assignment.accepted_at || now },
        lead_updates: { status: 'won', current_stage: 'won', ownership_status: 'protected' },
        event_type: 'lead_won',
        summary: 'Partner marked the lead as won.'
      },
      mark_lost: {
        assignment_updates: { assignment_status: assignment.assignment_status || 'accepted' },
        lead_updates: { status: 'lost', current_stage: 'lost', ownership_status: 'released' },
        event_type: 'lead_lost',
        summary: 'Partner marked the lead as lost.'
      },
      mark_invalid: {
        assignment_updates: { assignment_status: assignment.assignment_status || 'accepted' },
        lead_updates: { status: 'blocked', current_stage: 'blocked', ownership_status: 'released' },
        event_type: 'lead_marked_invalid',
        summary: 'Partner marked the lead as invalid.'
      },
      log_contact_attempt: {
        assignment_updates: { assignment_status: assignment.assignment_status === 'pending' ? 'accepted' : (assignment.assignment_status || 'accepted'), accepted_at: assignment.accepted_at || now },
        lead_updates: { status: 'contact_in_progress', current_stage: 'contact_in_progress', ownership_status: 'locked', protected_until: protectedUntil },
        event_type: 'contact_attempt_logged',
        summary: 'Partner logged a contact attempt.'
      },
      log_callback_booked: {
        assignment_updates: { assignment_status: assignment.assignment_status === 'pending' ? 'accepted' : (assignment.assignment_status || 'accepted'), accepted_at: assignment.accepted_at || now },
        lead_updates: { status: 'callback_booked', current_stage: 'callback_booked', ownership_status: 'locked', protected_until: protectedUntil },
        event_type: 'callback_booked',
        summary: 'Partner booked a callback.'
      },
      log_viewing_booked: {
        assignment_updates: { assignment_status: assignment.assignment_status === 'pending' ? 'accepted' : (assignment.assignment_status || 'accepted'), accepted_at: assignment.accepted_at || now },
        lead_updates: { status: 'viewing_booked', current_stage: 'viewing_booked', ownership_status: 'locked', protected_until: protectedUntil },
        event_type: 'viewing_booked',
        summary: 'Partner booked a viewing.'
      },
      log_viewing_completed: {
        assignment_updates: { assignment_status: assignment.assignment_status === 'pending' ? 'accepted' : (assignment.assignment_status || 'accepted'), accepted_at: assignment.accepted_at || now },
        lead_updates: { status: 'viewing_completed', current_stage: 'viewing_completed', ownership_status: 'protected', protected_until: protectedUntil },
        event_type: 'viewing_completed',
        summary: 'Partner completed a viewing.'
      }
    };

    const selected = actionMap[action];
    if (!selected) {
      return Response.json({ error: 'Unsupported action' }, { status: 400 });
    }

    if (assignment.assignment_status === 'rejected' || assignment.assignment_status === 'expired') {
      return Response.json({ error: 'This assignment is no longer actionable' }, { status: 400 });
    }

    if (noteRequiredActions.includes(action) && !notes?.trim()) {
      return Response.json({ error: 'notes are required for this action' }, { status: 400 });
    }

    if ((action === 'log_callback_booked' || action === 'log_viewing_booked' || action === 'log_viewing_completed') && !scheduled_at) {
      return Response.json({ error: 'scheduled_at is required for this action' }, { status: 400 });
    }

    if ((action === 'mark_lost' || action === 'mark_invalid') && !outcome) {
      return Response.json({ error: 'outcome is required for this action' }, { status: 400 });
    }

    const updatedAssignment = await base44.entities.LeadAssignment.update(assignment_id, { ...selected.assignment_updates, sla_status: slaStatus });
    const updatedLead = await base44.entities.Lead.update(lead_id, selected.lead_updates);

    if (action === 'log_contact_attempt' || action === 'log_callback_booked') {
      await base44.entities.LeadContactAttempt.create({
        lead_id,
        partner_id: partnerAgencyId,
        attempt_type: action,
        channel: outcome || 'call',
        attempt_at: parsedSchedule,
        outcome: notes || action,
        notes: notes || ''
      });
    }

    if (action === 'log_viewing_booked' || action === 'log_viewing_completed') {
      await base44.entities.Viewing.create({
        lead_id,
        listing_id: lead.listing_id,
        scheduled_at: parsedSchedule,
        status: action === 'log_viewing_completed' ? 'completed' : 'confirmed',
        broker_id: lead.assigned_broker_id || '',
        completion_notes: notes || '',
        lost_reason: ''
      });
    }

    const event = await base44.entities.LeadEvent.create({
      lead_id,
      event_type: selected.event_type,
      actor_type: 'partner',
      actor_user_id: user.id,
      partner_id: partnerAgencyId,
      summary: selected.summary,
      reason: notes || '',
      event_payload_json: {
        assignment_id,
        action,
        notes: notes || '',
        outcome: outcome || '',
        scheduled_at: scheduled_at || '',
        workflow_type: ['accept', 'reject', 'request_reassignment'].includes(action)
          ? 'assignment'
          : ['log_contact_attempt', 'log_callback_booked'].includes(action)
            ? 'contact'
            : ['log_viewing_booked', 'log_viewing_completed'].includes(action)
              ? 'viewing'
              : 'outcome'
      },
      immutable: true,
    });

    let reassignment = null;
    if (action === 'reject' || action === 'request_reassignment') {
      const agencies = await base44.entities.PartnerAgency.list('-updated_date', 200);
      const assignments = await base44.entities.LeadAssignment.list('-updated_date', 500);
      const candidates = agencies.filter((item) => item.status === 'active' && item.id !== partnerAgencyId);
      const ranked = candidates
        .map((item) => {
          const pending = assignments.filter((row) => row.partner_id === item.id && row.assignment_status === 'pending').length;
          const capacityLimit = Number(item.capacity_limit || 0);
          const capacityPenalty = capacityLimit > 0 ? Math.max(0, pending - capacityLimit) * 25 : pending * 10;
          const score = ((Number(item.partner_trust_score || 0) * 0.35) + (Number(item.performance_score || 0) * 0.35) + (Number(item.response_score || 0) * 0.2) + (Number(item.routing_weight || 1) * 10)) - capacityPenalty;
          return { partner: item, score };
        })
        .sort((a, b) => b.score - a.score);

      if (ranked[0]?.partner?.id) {
        reassignment = await base44.entities.LeadAssignment.create({
          lead_id,
          partner_id: ranked[0].partner.id,
          assignment_type: 'rule_based',
          assigned_at: now,
          assignment_status: 'pending',
          assignment_reason: `Auto-reassigned after ${action}${notes ? `: ${notes}` : ''} | enterprise_routing`,
          assigned_by: 'system',
          sla_due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
        await base44.entities.Lead.update(lead_id, { assigned_partner_id: ranked[0].partner.id, status: 'assigned', current_stage: 'assigned' });
        await base44.entities.LeadEvent.create({
          lead_id,
          event_type: 'lead_auto_reassigned',
          actor_type: 'system',
          summary: 'Lead auto-reassigned after partner rejection/request.',
          reason: notes || action,
          event_payload_json: {
            previous_partner_id: partnerAgencyId,
            new_partner_id: ranked[0].partner.id,
            previous_assignment_id: assignment_id,
            routing_reason: `enterprise_routing | trust:${ranked[0].partner.partner_trust_score || 0} | performance:${ranked[0].partner.performance_score || 0} | response:${ranked[0].partner.response_score || 0} | weight:${ranked[0].partner.routing_weight || 1}`
          },
          immutable: true,
        });
      }
    }

    await base44.entities.Notification.create({
      title: selected.summary,
      body: `${updatedLead.lead_code || updatedLead.id} changed to ${updatedLead.status || 'updated'} by the assigned partner.`,
      lead_id,
      channel: 'in_app',
      status: 'queued',
    });

    return Response.json({ lead: updatedLead, assignment: updatedAssignment, event, reassignment });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});