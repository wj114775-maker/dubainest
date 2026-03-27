import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const leads = await base44.asServiceRole.entities.Lead.list('-updated_date', 200);
    const windows = await base44.asServiceRole.entities.LeadProtectionWindow.list('-updated_date', 400);
    const alerts = await base44.asServiceRole.entities.CircumventionAlert.list('-updated_date', 400);
    const now = new Date();
    let reconciled = 0;

    for (const lead of leads) {
      const leadWindows = windows.filter((item) => item.lead_id === lead.id);
      const activeWindow = leadWindows.find((item) => item.status === 'active');
      const openAlert = alerts.find((item) => item.lead_id === lead.id && ['open', 'reviewing', 'awaiting_partner_response', 'escalated'].includes(item.status));

      if (activeWindow?.protected_until && new Date(activeWindow.protected_until) < now) {
        await base44.asServiceRole.entities.LeadProtectionWindow.update(activeWindow.id, {
          status: 'expired',
          override_reason: activeWindow.override_reason || 'Protection window expired automatically'
        });
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          ownership_status: openAlert ? 'override_pending' : 'released',
          protected_until: null
        });
        reconciled += 1;
        continue;
      }

      const nextOwnershipStatus = openAlert ? 'protected' : activeWindow ? 'locked' : (lead.assigned_partner_id ? 'soft_owned' : 'released');
      const nextProtectedUntil = activeWindow?.protected_until || null;

      if (lead.ownership_status !== nextOwnershipStatus || lead.protected_until !== nextProtectedUntil) {
        await base44.asServiceRole.entities.Lead.update(lead.id, {
          ownership_status: nextOwnershipStatus,
          protected_until: nextProtectedUntil,
          is_circumvention_flagged: Boolean(openAlert)
        });
        reconciled += 1;
      }
    }

    return Response.json({ reconciled });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});