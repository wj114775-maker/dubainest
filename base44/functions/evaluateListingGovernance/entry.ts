import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calculateCompleteness(listing) {
  const fields = [
    listing.title,
    listing.description,
    listing.hero_image_url,
    listing.price,
    listing.bedrooms,
    listing.bathrooms,
    listing.built_up_area_sqft,
    listing.property_type,
    listing.area_id,
    listing.project_id
  ];
  const filled = fields.filter((value) => value !== undefined && value !== null && value !== '').length;
  return Math.round((filled / fields.length) * 100);
}

function calculateFreshness(lastRefreshedAt, staleAfterDays = 30) {
  if (!lastRefreshedAt) {
    return { score: 20, status: 'stale', ageDays: null };
  }

  const ageMs = Date.now() - new Date(lastRefreshedAt).getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60 * 24)));

  if (ageDays <= Math.floor(staleAfterDays * 0.5)) return { score: 100, status: 'fresh', ageDays };
  if (ageDays <= staleAfterDays) return { score: 70, status: 'aging', ageDays };
  if (ageDays <= staleAfterDays * 2) return { score: 35, status: 'stale', ageDays };
  return { score: 10, status: 'expired', ageDays };
}

function getTrustBand(score) {
  if (score >= 85) return 'verified';
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function listingFingerprint(listing) {
  return [listing.title, listing.price, listing.area_id, listing.project_id, listing.property_type]
    .filter(Boolean)
    .join('|')
    .toLowerCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listing_id } = await req.json();
    if (!listing_id) {
      return Response.json({ error: 'listing_id is required' }, { status: 400 });
    }

    const listing = await base44.entities.Listing.get(listing_id);
    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    const [permits, verifications, evidence, cases, authorityRecords, projectVerifications, brokerVerifications, allListings, duplicateReviewRecords] = await Promise.all([
      base44.entities.ListingPermit.filter({ listing_id }),
      base44.entities.ListingVerification.filter({ listing_id }),
      base44.entities.ComplianceEvidence.filter({ listing_id }),
      base44.entities.ComplianceCase.filter({ listing_id }),
      base44.entities.ListingAuthorityRecord.filter({ listing_id }),
      listing.project_id ? base44.entities.ProjectVerification.filter({ project_id: listing.project_id }) : Promise.resolve([]),
      listing.broker_id ? base44.entities.BrokerVerification.filter({ broker_id: listing.broker_id }) : Promise.resolve([]),
      base44.entities.Listing.list('-updated_date', 200),
      base44.entities.ListingDuplicateReview.list('-updated_date', 500)
    ]);

    const latestPermit = permits.sort((a, b) => new Date(b.updated_date).getTime() - new Date(a.updated_date).getTime())[0];
    const permitExpired = latestPermit?.expiry_date ? new Date(latestPermit.expiry_date) < new Date() : false;
    const permitValid = latestPermit?.status === 'verified' && latestPermit?.expiry_date && new Date(latestPermit.expiry_date) >= new Date();
    const authorityValid = authorityRecords.some((item) => item.status === 'valid');
    const brokerVerified = brokerVerifications.some((item) => item.status === 'passed');
    const projectVerified = projectVerifications.some((item) => item.status === 'passed');
    const openCases = cases.filter((item) => !['resolved', 'closed', 'approved'].includes(item.status));
    const validEvidence = evidence.filter((item) => ['submitted', 'accepted'].includes(item.status || 'submitted'));
    const evidenceCount = validEvidence.length;
    const completenessScore = calculateCompleteness(listing);
    const freshness = calculateFreshness(listing.last_refreshed_at, Number(listing.stale_after_days || 30));

    const currentFingerprint = listingFingerprint(listing);
    const duplicateCandidates = allListings.filter((item) => item.id !== listing_id && listingFingerprint(item) === currentFingerprint);
    const duplicateCandidateIds = duplicateCandidates.map((item) => item.id);
    const relevantDuplicateReviews = duplicateReviewRecords.filter((item) =>
      [listing_id, ...duplicateCandidateIds].includes(item.listing_id) ||
      [listing_id, ...duplicateCandidateIds].includes(item.matched_listing_id)
    );

    const getPairReview = (candidateId) =>
      relevantDuplicateReviews.find((item) =>
        (item.listing_id === listing_id && item.matched_listing_id === candidateId) ||
        (item.listing_id === candidateId && item.matched_listing_id === listing_id)
      );

    const defaultPrimaryListing = [listing, ...duplicateCandidates]
      .sort((a, b) => (Number(b.trust_score || 0) - Number(a.trust_score || 0)) || new Date(a.created_date).getTime() - new Date(b.created_date).getTime())[0];

    for (const candidate of duplicateCandidates) {
      const existingPair = getPairReview(candidate.id);
      if (!existingPair) {
        const createdReview = await base44.entities.ListingDuplicateReview.create({
          listing_id,
          matched_listing_id: candidate.id,
          status: 'candidate',
          confidence_score: 92,
          primary_listing_id: defaultPrimaryListing.id,
          decision_reason: 'Automated duplicate fingerprint match'
        });
        relevantDuplicateReviews.push(createdReview);
      }
    }

    const duplicatePairs = duplicateCandidates.map((candidate) => ({
      candidate,
      review: getPairReview(candidate.id)
    }));
    const activeDuplicatePairs = duplicatePairs.filter(({ review }) => review?.status !== 'dismissed');
    const primaryOverrideId = listing.duplicate_status === 'primary'
      ? listing_id
      : activeDuplicatePairs.map(({ review }) => review?.primary_listing_id).find((value) => value && [listing_id, ...duplicateCandidateIds].includes(value));
    const primaryListing = [listing, ...duplicateCandidates].find((item) => item.id === primaryOverrideId) || defaultPrimaryListing;
    const duplicateRiskScore = activeDuplicatePairs.length ? 80 : 15;
    const duplicateBlocked = activeDuplicatePairs.length > 0 && primaryListing.id !== listing_id;
    const trustScore = clamp(
      (permitValid ? 25 : 0) +
      (brokerVerified ? 15 : 0) +
      (projectVerified ? 10 : 0) +
      (authorityValid ? 15 : 0) +
      Math.round(completenessScore * 0.2) +
      Math.round(freshness.score * 0.15) +
      Math.min(evidenceCount * 3, 10) -
      Math.min(openCases.length * 8, 30) -
      Math.round(duplicateRiskScore * 0.1),
      0,
      100
    );

    const trustBand = getTrustBand(trustScore);
    const missingRequirements = [
      !permitValid ? 'valid_permit' : null,
      !authorityValid ? 'authority_record' : null,
      !brokerVerified ? 'broker_verification' : null,
      !projectVerified && listing.project_id ? 'project_verification' : null,
      completenessScore < 70 ? 'listing_completeness' : null,
      freshness.status !== 'fresh' && freshness.status !== 'aging' ? 'listing_refresh' : null,
      evidenceCount === 0 ? 'evidence' : null,
      duplicateBlocked ? 'duplicate_review' : null
    ].filter(Boolean);

    const openIssueCodes = [
      ...openCases.map((item) => item.category),
      ...(permitExpired ? ['permit_expired'] : []),
      ...(activeDuplicatePairs.length ? ['duplicate'] : []),
      ...(freshness.status === 'expired' ? ['stale_expired'] : [])
    ];

    const canPublish = permitValid && authorityValid && brokerVerified && freshness.status !== 'expired' && trustScore >= 70 && !duplicateBlocked;
    const publicationStatus = canPublish
      ? (listing.publication_status === 'published' ? 'published' : 'eligible')
      : (permitExpired || freshness.status === 'expired' || duplicateBlocked ? 'frozen' : 'suppressed');
    const status = canPublish
      ? (listing.status === 'published' ? 'published' : 'verified')
      : (permitExpired ? 'frozen' : duplicateBlocked ? 'flagged' : freshness.status === 'stale' || freshness.status === 'expired' ? 'stale' : openCases.length ? 'flagged' : 'verification_pending');

    const updatedListing = await base44.entities.Listing.update(listing_id, {
      permit_verified: permitValid,
      broker_verified: brokerVerified,
      project_status_verified: projectVerified,
      verification_status: canPublish ? 'verified' : 'pending',
      authority_status: authorityValid ? 'valid' : 'invalid',
      trust_score: trustScore,
      trust_band: trustBand,
      completeness_score: completenessScore,
      freshness_score: freshness.score,
      freshness_status: freshness.status,
      duplicate_risk_score: duplicateRiskScore,
      duplicate_status: activeDuplicatePairs.length
        ? (primaryListing.id === listing_id ? 'primary' : activeDuplicatePairs.some(({ review }) => review?.status === 'under_review') ? 'under_review' : 'suppressed')
        : (listing.duplicate_status === 'primary' ? 'primary' : 'clear'),
      primary_listing_id: activeDuplicatePairs.length || listing.duplicate_status === 'primary' ? primaryListing.id : '',
      duplicate_group_key: activeDuplicatePairs.length ? currentFingerprint : '',
      issue_count: openIssueCodes.length,
      evidence_count: evidenceCount,
      missing_requirements: missingRequirements,
      open_issue_codes: openIssueCodes,
      publication_status: publicationStatus,
      status,
      publish_block_reason: canPublish ? '' : missingRequirements.join(', '),
      freeze_reason: permitExpired ? 'permit_expired' : duplicateBlocked ? 'duplicate_detected' : freshness.status === 'expired' ? 'freshness_expired' : '',
      frozen_at: publicationStatus === 'frozen' ? new Date().toISOString() : null,
      last_checked_at: new Date().toISOString()
    });

    if (!canPublish && missingRequirements.includes('evidence') && !openCases.find((item) => item.category === 'evidence_missing')) {
      await base44.entities.ComplianceCase.create({
        listing_id,
        partner_agency_id: listing.partner_agency_id,
        severity: 'medium',
        category: 'evidence_missing',
        summary: `Evidence required for ${listing.title}`,
        status: 'awaiting_evidence',
        trust_impact: 10
      });
    }

    if (evidence.some((item) => item.status === 'accepted')) {
      const evidenceCases = openCases.filter((item) => item.category === 'evidence_missing');
      await Promise.all(
        evidenceCases.map((item) =>
          base44.entities.ComplianceCase.update(item.id, {
            status: 'resolved',
            resolution_notes: 'Evidence accepted and governance requirements satisfied.',
            resolved_at: new Date().toISOString(),
            freeze_active: false
          })
        )
      );
    } else if (validEvidence.length) {
      const evidenceCases = openCases.filter((item) => item.category === 'evidence_missing' && item.status === 'awaiting_evidence');
      await Promise.all(
        evidenceCases.map((item) =>
          base44.entities.ComplianceCase.update(item.id, {
            status: 'under_review',
            resolution_notes: 'Evidence submitted by partner and waiting for internal review.'
          })
        )
      );
    }

    if (duplicateBlocked && !openCases.find((item) => item.category === 'duplicate')) {
      await base44.entities.ComplianceCase.create({
        listing_id,
        partner_agency_id: listing.partner_agency_id,
        severity: 'high',
        category: 'duplicate',
        summary: `Duplicate review required for ${listing.title}`,
        status: 'triage',
        trust_impact: 15
      });
    }

    if (!activeDuplicatePairs.length) {
      const duplicateCases = openCases.filter((item) => item.category === 'duplicate');
      await Promise.all(
        duplicateCases.map((item) =>
          base44.entities.ComplianceCase.update(item.id, {
            status: 'resolved',
            resolution_notes: 'Duplicate review cleared for this listing.',
            resolved_at: new Date().toISOString(),
            freeze_active: false
          })
        )
      );
    }

    const notifications = [];
    if (status === 'verified') notifications.push({ title: 'Listing verified', body: `${listing.title} passed verification and is eligible for publication.` });
    if (publicationStatus === 'frozen') notifications.push({ title: 'Listing frozen', body: `${listing.title} was frozen due to permit, authority, freshness, or duplicate issues.` });
    if (freshness.status === 'stale' || freshness.status === 'expired') notifications.push({ title: 'Stale-stock reminder', body: `${listing.title} needs a refresh to remain publishable.` });
    if (permitExpired) notifications.push({ title: 'Permit expiry alert', body: `${listing.title} has an expired permit and requires action.` });
    if (missingRequirements.includes('evidence')) notifications.push({ title: 'Evidence requested', body: `${listing.title} needs supporting evidence before publication.` });
    if (listing.status === 'submitted') notifications.push({ title: 'Listing submitted', body: `${listing.title} is now in the internal review queue.` });

    for (const item of notifications) {
      await base44.entities.Notification.create({
        title: item.title,
        body: item.body,
        channel: 'in_app',
        status: 'queued'
      });
    }

    await base44.entities.AuditLog.create({
      entity_name: 'Listing',
      entity_id: listing_id,
      action: 'listing_governance_evaluated',
      actor_id: user.id,
      summary: `Listing governance evaluated for ${listing.title}`,
      immutable: true,
      scope: 'compliance',
      metadata: {
        trust_score: trustScore,
        trust_band: trustBand,
        freshness_status: freshness.status,
        publication_status: publicationStatus,
        missing_requirements: missingRequirements,
        duplicate_candidates: activeDuplicatePairs.map(({ candidate }) => candidate.id)
      }
    });

    return Response.json({
      listing: updatedListing,
      governance: {
        trust_score: trustScore,
        trust_band: trustBand,
        freshness_status: freshness.status,
        completeness_score: completenessScore,
        duplicate_risk_score: duplicateRiskScore,
        missing_requirements: missingRequirements,
        can_publish: canPublish
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
