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

    const agencies = await base44.asServiceRole.entities.PartnerAgency.list('-updated_date', 200);

    for (const assignment of expired) {
      await base44.asServiceRole.entities.LeadAssignment.update(assignment.id, { assignment_status: 'expired', sla_status: 'breached' });

      const candidates = agencies
        .filter((item) => item.status === 'active' && item.id !== assignment.partner_id)
        .map((item) => ({
          partner: item,
          score: Number(item.partner_trust_score || 0) - assignments.filter((row) => row.partner_id === item.id && row.assignment_status === 'pending').length * 10
        }))
        .sort((a, b) => b.score - a.score);

      const reassignedPartnerId = candidates[0]?.partner?.id || null;

      if (reassignedPartnerId) {
        await base44.asServiceRole.entities.LeadAssignment.create({
          lead_id: assignment.lead_id,
          partner_id: reassignedPartnerId,
          assignment_type: 'rule_based',
          assigned_at: new Date().toISOString(),
          assignment_status: 'pending',
          assignment_reason: 'Auto-reassigned after SLA breach',
          assigned_by: 'system',
          sla_due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
        await base44.asServiceRole.entities.Lead.update(assignment.lead_id, {
          assigned_partner_id: reassignedPartnerId,
          status: 'assigned',
          current_stage: 'assigned',
          ownership_status: 'released'
        });
      }

      await base44.asServiceRole.entities.Notification.create({
        title: 'Lead SLA breached',
        body: `Lead assignment ${assignment.id} has passed its SLA window.${reassignedPartnerId ? ' The lead was auto-reassigned.' : ''}`,
        channel: 'in_app',
        status: 'queued',
      });
      await base44.asServiceRole.entities.LeadEvent.create({
        lead_id: assignment.lead_id,
        event_type: 'sla_breached',
        actor_type: 'system',
        summary: reassignedPartnerId ? 'Lead assignment expired and was auto-reassigned.' : 'Lead assignment expired without partner action.',
        reason: reassignedPartnerId ? 'Auto-reassigned after SLA breach' : 'SLA breach without eligible reassignment target',
        event_payload_json: { assignment_id: assignment.id, reassigned_partner_id: reassignedPartnerId },
      });
    }

    return Response.json({ escalated: expired.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});