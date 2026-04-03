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

    const { listing_id, review_id = '', decision, reason = '', matched_listing_id = '' } = await req.json();
    if (!listing_id || !decision || !reason.trim()) {
      return Response.json({ error: 'listing_id, decision and reason are required' }, { status: 400 });
    }

    const listing = await base44.asServiceRole.entities.Listing.get(listing_id);
    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    let updatedReview = null;

    if (decision === 'mark_primary') {
      const activeReviews = await base44.asServiceRole.entities.ListingDuplicateReview.filter({ listing_id });
      await Promise.all(
        activeReviews.map((item) =>
          base44.asServiceRole.entities.ListingDuplicateReview.update(item.id, {
            primary_listing_id: listing_id,
            reviewer_id: user.id,
            decision_reason: reason,
            status: item.status === 'dismissed' ? 'candidate' : item.status
          })
        )
      );
      await base44.asServiceRole.entities.Listing.update(listing_id, {
        duplicate_status: 'primary',
        primary_listing_id: listing_id,
        publication_status: listing.publication_status === 'suppressed' ? 'eligible' : listing.publication_status
      });
    } else {
      if (!review_id) {
        return Response.json({ error: 'review_id is required for this decision' }, { status: 400 });
      }
      const statusMap = {
        under_review: 'under_review',
        confirm_duplicate: 'confirmed_duplicate',
        dismiss: 'dismissed'
      };
      if (!statusMap[decision]) {
        return Response.json({ error: 'Unsupported decision' }, { status: 400 });
      }

      updatedReview = await base44.asServiceRole.entities.ListingDuplicateReview.update(review_id, {
        status: statusMap[decision],
        reviewer_id: user.id,
        decision_reason: reason,
        primary_listing_id: decision === 'dismiss' ? '' : (listing.primary_listing_id || matched_listing_id || '')
      });

      if (decision === 'confirm_duplicate') {
        await base44.asServiceRole.entities.Listing.update(listing_id, {
          duplicate_status: 'suppressed',
          primary_listing_id: matched_listing_id || listing.primary_listing_id || '',
          publication_status: 'suppressed',
          status: 'flagged',
          publish_block_reason: reason
        });
      }

      if (decision === 'dismiss') {
        const allReviews = await base44.asServiceRole.entities.ListingDuplicateReview.filter({ listing_id });
        const remainingActive = allReviews.filter((item) => item.id !== review_id && item.status !== 'dismissed');
        if (!remainingActive.length) {
          await base44.asServiceRole.entities.Listing.update(listing_id, {
            duplicate_status: 'clear',
            primary_listing_id: '',
            publish_block_reason: ''
          });
        }
      }
    }

    const duplicateVerifications = await base44.asServiceRole.entities.ListingVerification.filter({ listing_id });
    const existingDuplicateCheck = duplicateVerifications.find((item) => item.verification_type === 'duplicate_check');
    const verificationPayload = {
      status: decision === 'dismiss' || decision === 'mark_primary' ? 'passed' : decision === 'confirm_duplicate' ? 'failed' : 'manual_review',
      reviewer_id: user.id,
      verified_at: now,
      decision_reason: reason
    };

    const verification = existingDuplicateCheck
      ? await base44.asServiceRole.entities.ListingVerification.update(existingDuplicateCheck.id, verificationPayload)
      : await base44.asServiceRole.entities.ListingVerification.create({
          listing_id,
          verification_type: 'duplicate_check',
          ...verificationPayload
        });

    const audit = await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'Listing',
      entity_id: listing_id,
      action: 'listing_duplicate_reviewed',
      actor_id: user.id,
      actor_user_id: user.id,
      summary: `${decision} duplicate workflow for ${listing.title}`,
      immutable: true,
      scope: 'compliance',
      metadata: {
        review_id,
        matched_listing_id,
        decision,
        reason,
        verification_id: verification.id
      }
    });

    return Response.json({ review: updatedReview, verification, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
