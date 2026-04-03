import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, listing_id = '', payload = {}, notes = '', evidence_url = '', resubmit = true, mode = 'response' } = await req.json();
    if (!action) {
      return Response.json({ error: 'action is required' }, { status: 400 });
    }

    const profiles = await base44.entities.PartnerUserProfile.filter({ user_id: user.id });
    const partnerAgencyId = profiles[0]?.partner_agency_id;
    if (!partnerAgencyId) {
      return Response.json({ error: 'Partner agency not found for user' }, { status: 403 });
    }

    const now = new Date().toISOString();

    if (action === 'create') {
      const listing = await base44.asServiceRole.entities.Listing.create({
        ...payload,
        slug: payload.slug || slugify(payload.title),
        partner_agency_id: partnerAgencyId,
        partner_verified: true,
        status: 'draft',
        publication_status: 'draft',
        last_refreshed_at: now
      });

      const audit = await base44.asServiceRole.entities.AuditLog.create({
        entity_name: 'Listing',
        entity_id: listing.id,
        action: 'partner_listing_created',
        actor_id: user.id,
        actor_user_id: user.id,
        summary: `Partner created ${listing.title}`,
        immutable: true,
        scope: 'partner',
        metadata: { partner_agency_id: partnerAgencyId }
      });

      return Response.json({ listing, audit });
    }

    if (!listing_id) {
      return Response.json({ error: 'listing_id is required for this action' }, { status: 400 });
    }

    const listing = await base44.asServiceRole.entities.Listing.get(listing_id);
    if (!listing || listing.partner_agency_id !== partnerAgencyId) {
      return Response.json({ error: 'Listing not found for this partner' }, { status: 404 });
    }

    if (action === 'update') {
      const updatedListing = await base44.asServiceRole.entities.Listing.update(listing_id, {
        ...payload,
        slug: payload.slug || slugify(payload.title || listing.title)
      });

      const audit = await base44.asServiceRole.entities.AuditLog.create({
        entity_name: 'Listing',
        entity_id: listing_id,
        action: 'partner_listing_updated',
        actor_id: user.id,
        actor_user_id: user.id,
        summary: `Partner updated ${updatedListing.title}`,
        immutable: true,
        scope: 'partner',
        metadata: { partner_agency_id: partnerAgencyId }
      });

      return Response.json({ listing: updatedListing, audit });
    }

    if (action === 'submit') {
      const updatedListing = await base44.asServiceRole.entities.Listing.update(listing_id, { status: 'submitted' });
      return Response.json({ listing: updatedListing });
    }

    if (action === 'refresh') {
      const updatedListing = await base44.asServiceRole.entities.Listing.update(listing_id, { status: 'submitted', last_refreshed_at: now });
      return Response.json({ listing: updatedListing });
    }

    if (action === 'republish') {
      const decision = await base44.asServiceRole.entities.ListingPublicationDecision.create({
        listing_id,
        decision_type: 'republish',
        decision_status: 'pending',
        actor_user_id: user.id,
        reason: 'Partner requested republish',
        snapshot: { status: listing.status, publication_status: listing.publication_status }
      });
      const updatedListing = await base44.asServiceRole.entities.Listing.update(listing_id, { status: 'under_review', publication_status: 'suppressed' });
      return Response.json({ listing: updatedListing, decision });
    }

    if (action === 'respond' || action === 'evidence') {
      const allCases = await base44.asServiceRole.entities.ComplianceCase.filter({ listing_id });
      const openCases = allCases.filter((item) => !['resolved', 'closed', 'approved'].includes(item.status));
      let responseCase = openCases[0];

      if (!responseCase) {
        responseCase = await base44.asServiceRole.entities.ComplianceCase.create({
          listing_id,
          partner_agency_id: partnerAgencyId,
          severity: 'medium',
          category: 'evidence_missing',
          status: 'under_review',
          summary: `Partner response submitted for ${listing.title}`
        });
      }

      const evidence = await base44.asServiceRole.entities.ComplianceEvidence.create({
        listing_id,
        compliance_case_id: responseCase.id,
        file_url: evidence_url || listing.hero_image_url || 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80',
        evidence_type: evidence_url ? 'external_link' : 'note',
        notes,
        status: 'submitted',
        uploaded_by: user.id
      });

      await Promise.all(
        openCases.map((item) =>
          base44.asServiceRole.entities.ComplianceCase.update(item.id, {
            status: 'under_review',
            resolution_notes: notes,
            assigned_reviewer_id: item.assigned_reviewer_id || user.id
          })
        )
      );

      const updatedListing = await base44.asServiceRole.entities.Listing.update(listing_id, {
        status: resubmit ? 'submitted' : 'under_review',
        publication_status: 'suppressed',
        last_refreshed_at: now
      });

      const audit = await base44.asServiceRole.entities.AuditLog.create({
        entity_name: 'Listing',
        entity_id: listing_id,
        action: mode === 'response' ? 'partner_review_response_submitted' : 'partner_evidence_submitted',
        actor_id: user.id,
        actor_user_id: user.id,
        summary: `${mode === 'response' ? 'Review response' : 'Evidence'} submitted for ${listing.title}`,
        immutable: true,
        scope: 'partner',
        metadata: {
          listing_id,
          compliance_case_id: responseCase.id,
          evidence_id: evidence.id,
          resubmit
        }
      });

      return Response.json({ listing: updatedListing, evidence, audit });
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
