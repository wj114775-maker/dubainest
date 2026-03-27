import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lead_id, assignment_id, action, notes } = await req.json();

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
    const isAccept = action === 'accept';
    const isReject = action === 'reject';

    if (!isAccept && !isReject) {
      return Response.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const updatedAssignment = await base44.entities.LeadAssignment.update(assignment_id, {
      assignment_status: isAccept ? 'accepted' : 'rejected',
      accepted_at: isAccept ? now : assignment.accepted_at,
      rejected_at: isReject ? now : assignment.rejected_at,
    });

    const leadUpdates = isAccept
      ? {
          status: 'accepted',
          current_stage: 'accepted',
          ownership_status: 'locked',
          assigned_partner_id: partnerAgencyId,
          protected_until: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        }
      : {
          status: 'qualified',
          current_stage: 'qualified',
          ownership_status: 'released',
        };

    const updatedLead = await base44.entities.Lead.update(lead_id, leadUpdates);

    const event = await base44.entities.LeadEvent.create({
      lead_id,
      event_type: isAccept ? 'partner_assignment_accepted' : 'partner_assignment_rejected',
      actor_type: 'partner',
      actor_user_id: user.id,
      partner_id: partnerAgencyId,
      summary: isAccept ? 'Partner accepted lead assignment.' : 'Partner rejected lead assignment.',
      reason: notes || '',
      event_payload_json: { assignment_id, action, notes: notes || '' },
      immutable: true,
    });

    await base44.entities.Notification.create({
      title: isAccept ? 'Lead accepted by partner' : 'Lead rejected by partner',
      body: `${updatedLead.lead_code || updatedLead.id} was ${isAccept ? 'accepted' : 'rejected'} by the assigned partner.`,
      channel: 'in_app',
      status: 'queued',
    });

    return Response.json({ lead: updatedLead, assignment: updatedAssignment, event });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});