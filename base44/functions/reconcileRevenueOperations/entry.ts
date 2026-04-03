import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function hasPermission(user, assignments, requiredPermissions = []) {
  if (user?.role === 'admin') return true;
  const granted = new Set(assignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]));
  return requiredPermissions.some((permission) => granted.has(permission));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user) {
      const assignments = await base44.entities.UserRoleAssignment.filter({ user_id: user.id, status: 'active' });
      const activeAssignments = assignments.filter((assignment) => !assignment.end_date || new Date(assignment.end_date) >= new Date());
      if (!hasPermission(user, activeAssignments, ['revenue.read', 'payment.manage', 'invoice.manage'])) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const [entitlements, invoices, payouts, disputes] = await Promise.all([
      base44.asServiceRole.entities.RevenueEntitlement.list('-updated_date', 300),
      base44.asServiceRole.entities.InvoiceRecord.list('-updated_date', 300),
      base44.asServiceRole.entities.PayoutRecord.list('-updated_date', 300),
      base44.asServiceRole.entities.RevenueDispute.list('-updated_date', 300)
    ]);

    const now = new Date();
    let invoiceOverdueCount = 0;
    let payoutOverdueCount = 0;
    let entitlementUpdatedCount = 0;

    for (const invoice of invoices) {
      if (invoice.due_date && new Date(invoice.due_date) < now && ['issued', 'acknowledged', 'partially_paid'].includes(invoice.invoice_status)) {
        await base44.asServiceRole.entities.InvoiceRecord.update(invoice.id, { invoice_status: 'overdue' });
        invoice.invoice_status = 'overdue';
        invoiceOverdueCount += 1;
        await base44.asServiceRole.entities.Notification.create({
          title: 'Invoice overdue',
          body: `${invoice.invoice_number || invoice.id} is overdue and requires follow-up.`,
          entitlement_id: invoice.entitlement_id || '',
          invoice_id: invoice.id,
          category: 'revenue',
          route_path: `/ops/revenue/${invoice.entitlement_id || ''}`,
          channel: 'in_app',
          status: 'queued'
        });
      }
    }

    for (const payout of payouts) {
      if (payout.expected_date && new Date(payout.expected_date) < now && ['expected', 'pending', 'partially_paid'].includes(payout.payout_status)) {
        await base44.asServiceRole.entities.PayoutRecord.update(payout.id, { payout_status: 'overdue' });
        payout.payout_status = 'overdue';
        payoutOverdueCount += 1;
      }
    }

    for (const entitlement of entitlements) {
      const linkedInvoice = invoices.find((item) => item.id === entitlement.invoice_id || item.entitlement_id === entitlement.id);
      const linkedPayout = payouts.find((item) => item.id === entitlement.payout_id || item.entitlement_id === entitlement.id);
      const linkedDispute = disputes.find((item) => item.entitlement_id === entitlement.id && !['resolved', 'rejected', 'closed'].includes(item.status));
      let nextStatus = entitlement.entitlement_status;

      if (linkedDispute) {
        nextStatus = 'disputed';
      } else if (linkedPayout?.payout_status === 'paid') {
        nextStatus = 'paid';
      } else if (linkedPayout?.payout_status === 'partially_paid') {
        nextStatus = 'partially_paid';
      } else if (linkedInvoice && ['issued', 'acknowledged', 'overdue', 'partially_paid'].includes(linkedInvoice.invoice_status)) {
        nextStatus = linkedInvoice.invoice_status === 'partially_paid' ? 'partially_paid' : 'awaiting_payment';
      } else if (entitlement.invoice_id && entitlement.entitlement_status === 'invoiced') {
        nextStatus = 'awaiting_payment';
      }

      if (nextStatus !== entitlement.entitlement_status) {
        await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, { entitlement_status: nextStatus });
        entitlementUpdatedCount += 1;
      }
    }

    return Response.json({
      invoice_overdue: invoiceOverdueCount,
      payout_overdue: payoutOverdueCount,
      entitlement_updated: entitlementUpdatedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
