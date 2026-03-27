import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const listings = await base44.asServiceRole.entities.Listing.list('-updated_date', 200);
    const results = [];

    for (const listing of listings) {
      const response = await base44.functions.invoke('evaluateListingGovernance', { listing_id: listing.id });
      results.push({ listing_id: listing.id, status: response.data?.listing?.status || 'checked' });
    }

    const overdueCases = await base44.asServiceRole.entities.ComplianceCase.list('-updated_date', 200);
    const now = new Date();

    for (const item of overdueCases.filter((entry) => entry.sla_due_at && new Date(entry.sla_due_at) < now && !['resolved', 'closed', 'approved'].includes(entry.status))) {
      await base44.asServiceRole.entities.Notification.create({
        title: 'Case overdue alert',
        body: `${item.summary} is overdue and needs review.`,
        channel: 'in_app',
        status: 'queued'
      });
    }

    return Response.json({ checked: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});