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

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await base44.entities.UserRoleAssignment.filter({ user_id: user.id, status: 'active' });
    const activeAssignments = assignments.filter((assignment) => !assignment.end_date || new Date(assignment.end_date) >= new Date());
    if (!hasPermission(user, activeAssignments, ['compliance_cases.manage', 'compliance_rules.manage'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { listing_id, decision_type, reason = '' } = await req.json();
    if (!listing_id || !decision_type || !reason.trim()) {
      return Response.json({ error: 'listing_id, decision_type and reason are required' }, { status: 400 });
    }

    const listing = await base44.asServiceRole.entities.Listing.get(listing_id);
    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updateMap = {
      publish: { status: 'published', publication_status: 'published', published_at: now, frozen_at: null, rejected_at: null, freeze_reason: '', rejection_reason: '', publish_block_reason: '' },
      unpublish: { status: 'under_review', publication_status: 'suppressed', publish_block_reason: reason },
      freeze: { status: 'frozen', publication_status: 'frozen', frozen_at: now, freeze_reason: reason },
      reject: { status: 'rejected', publication_status: 'rejected', rejected_at: now, rejection_reason: reason },
      archive: { status: 'archived', publication_status: 'archived' },
      request_correction: { status: 'under_review', publication_status: 'suppressed', publish_block_reason: reason },
      republish: { status: 'published', publication_status: 'published', published_at: now, frozen_at: null, rejected_at: null, freeze_reason: '', rejection_reason: '', publish_block_reason: '' }
    };

    if (!updateMap[decision_type]) {
      return Response.json({ error: 'Unsupported decision_type' }, { status: 400 });
    }

    const decision = await base44.asServiceRole.entities.ListingPublicationDecision.create({
      listing_id,
      decision_type,
      decision_status: 'approved',
      actor_user_id: user.id,
      reason,
      snapshot: {
        status: listing.status,
        trust_score: listing.trust_score,
        freshness_status: listing.freshness_status,
        publication_status: listing.publication_status,
        duplicate_status: listing.duplicate_status
      }
    });

    const updatedListing = await base44.asServiceRole.entities.Listing.update(listing_id, updateMap[decision_type]);

    const audit = await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'Listing',
      entity_id: listing_id,
      action: 'listing_publication_decision',
      actor_id: user.id,
      actor_user_id: user.id,
      summary: `${decision_type} applied to ${listing.title}`,
      immutable: true,
      scope: 'compliance',
      metadata: {
        decision_type,
        reason,
        previous_status: listing.status,
        previous_publication_status: listing.publication_status,
        updated_status: updatedListing.status,
        updated_publication_status: updatedListing.publication_status
      }
    });

    return Response.json({ listing: updatedListing, decision, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
