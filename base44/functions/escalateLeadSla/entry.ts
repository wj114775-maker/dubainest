import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const assignments = await base44.asServiceRole.entities.LeadAssignment.list('-updated_date', 200);
    const now = new Date();
    const expired = assignments.filter((item) => item.assignment_status === 'pending' && item.sla_due_at && new Date(item.sla_due_at) < now);

    for (const assignment of expired) {
      await base44.asServiceRole.entities.LeadAssignment.update(assignment.id, { assignment_status: 'expired' });
      await base44.asServiceRole.entities.Notification.create({
        title: 'Lead SLA breached',
        body: `Lead assignment ${assignment.id} has passed its SLA window.`,
        channel: 'in_app',
        status: 'queued',
      });
      await base44.asServiceRole.entities.LeadEvent.create({
        lead_id: assignment.lead_id,
        event_type: 'sla_breached',
        actor_type: 'system',
        summary: 'Lead assignment expired without partner action.',
        event_payload_json: { assignment_id: assignment.id },
      });
    }

    return Response.json({ escalated: expired.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});