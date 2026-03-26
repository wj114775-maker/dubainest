import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { lead_id, event_type, summary, updates = {}, event_payload = {} } = payload;

    if (!lead_id || !event_type || !summary) {
      return Response.json({ error: 'lead_id, event_type and summary are required' }, { status: 400 });
    }

    const lead = await base44.entities.Lead.get(lead_id);
    if (!lead) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const updatedLead = Object.keys(updates).length ? await base44.entities.Lead.update(lead_id, updates) : lead;

    const event = await base44.entities.LeadEvent.create({
      lead_id,
      event_type,
      actor_user_id: user.id,
      actor_type: 'internal',
      summary,
      immutable: true,
      event_payload_json: event_payload
    });

    const audit = await base44.entities.AuditLog.create({
      organisation_id: lead?.organisation_id,
      entity_name: 'Lead',
      entity_id: lead_id,
      action: 'lead_event_recorded',
      actor_id: user.id,
      summary,
      immutable: true,
      scope: 'lead',
      metadata: { event_type, updates, event_payload }
    });

    return Response.json({ lead: updatedLead, event, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});