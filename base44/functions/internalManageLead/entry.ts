import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { lead_id, action, notes } = await req.json();

    if (!lead_id || !action) {
      return Response.json({ error: 'lead_id and action are required' }, { status: 400 });
    }

    const lead = await base44.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }

    const actionMap = {
      lock: {
        updates: {
          ownership_status: 'locked',
          protected_until: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        },
        event_type: 'lead_locked',
        summary: 'Internal ops locked the lead.'
      },
      release: {
        updates: {
          ownership_status: 'released',
          protected_until: null,
        },
        event_type: 'lead_released',
        summary: 'Internal ops released the lead.'
      },
      flag_circumvention: {
        updates: {
          is_circumvention_flagged: true,
          ownership_status: 'protected',
        },
        event_type: 'circumvention_flagged',
        summary: 'Internal ops flagged circumvention risk.'
      }
    };

    const selected = actionMap[action];
    if (!selected) {
      return Response.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const updatedLead = await base44.entities.Lead.update(lead_id, selected.updates);

    const event = await base44.entities.LeadEvent.create({
      lead_id,
      event_type: selected.event_type,
      actor_type: 'internal',
      actor_user_id: user.id,
      summary: selected.summary,
      reason: notes || '',
      event_payload_json: { action, notes: notes || '' },
      immutable: true,
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
      metadata: { notes: notes || '' }
    });

    return Response.json({ lead: updatedLead, event, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});