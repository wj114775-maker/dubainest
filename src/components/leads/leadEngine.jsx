import { base44 } from '@/api/base44Client';

export function normaliseEmail(value) {
  return value?.trim().toLowerCase() || '';
}

export function normalisePhone(value) {
  return value?.replace(/[^\d+]/g, '') || '';
}

export function buildLeadCode() {
  return `LD-${Date.now().toString().slice(-8)}`;
}

export function getSessionId() {
  const existing = window.localStorage.getItem('lead_session_id');
  if (existing) return existing;
  const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem('lead_session_id', created);
  return created;
}

export function getStoredAttribution() {
  const raw = window.localStorage.getItem('lead_attribution_state');
  return raw ? JSON.parse(raw) : {};
}

export function saveStoredAttribution(payload) {
  window.localStorage.setItem('lead_attribution_state', JSON.stringify(payload));
}

export function captureAnonymousAttribution(partial = {}) {
  const sessionId = getSessionId();
  const url = new URL(window.location.href);
  const current = getStoredAttribution();
  const next = {
    session_id: sessionId,
    landing_page: current.landing_page || url.pathname,
    first_referrer: current.first_referrer || document.referrer || '',
    utm_source: current.utm_source || url.searchParams.get('utm_source') || '',
    utm_medium: current.utm_medium || url.searchParams.get('utm_medium') || '',
    utm_campaign: current.utm_campaign || url.searchParams.get('utm_campaign') || '',
    utm_term: current.utm_term || url.searchParams.get('utm_term') || '',
    utm_content: current.utm_content || url.searchParams.get('utm_content') || '',
    first_action_type: current.first_action_type || partial.first_action_type || 'anonymous_visit',
    first_action_at: current.first_action_at || new Date().toISOString(),
    last_action_type: partial.last_action_type || partial.first_action_type || current.last_action_type || 'anonymous_visit',
    last_action_at: new Date().toISOString(),
    first_property_id: current.first_property_id || partial.first_property_id || '',
    first_project_id: current.first_project_id || partial.first_project_id || '',
    first_area_slug: current.first_area_slug || partial.first_area_slug || '',
    device_fingerprint: current.device_fingerprint || navigator.userAgent,
    attribution_model: current.attribution_model || 'first_touch',
  };
  saveStoredAttribution(next);
  return next;
}

export async function findExistingLead({ email, mobile, whatsapp }) {
  const identities = await base44.entities.LeadIdentity.list('-updated_date', 200);
  const emailNormalised = normaliseEmail(email);
  const mobileNormalised = normalisePhone(mobile);
  const whatsappNormalised = normalisePhone(whatsapp);

  const matched = identities.find((item) =>
    (emailNormalised && item.email_normalised === emailNormalised) ||
    (mobileNormalised && item.mobile_normalised === mobileNormalised) ||
    (whatsappNormalised && item.whatsapp_normalised === whatsappNormalised)
  );

  if (!matched) return null;
  const leads = await base44.entities.Lead.list('-updated_date', 200);
  return leads.find((lead) => lead.id === matched.lead_id) || null;
}

export async function createNotification(payload) {
  return base44.entities.Notification.create({
    channel: 'in_app',
    status: 'queued',
    ...payload,
  });
}

export async function createOrEnrichLeadFromIntent(payload) {
  const shortlists = await base44.entities.Shortlist.list('-updated_date', 50);
  const compareSets = await base44.entities.CompareSet.list('-updated_date', 50);
  const attribution = captureAnonymousAttribution({
    first_action_type: payload.intent_type,
    last_action_type: payload.intent_type,
    first_property_id: payload.listing_id,
    first_project_id: payload.project_id,
    first_area_slug: payload.area_id,
  });

  const existingLead = await findExistingLead(payload);
  const now = new Date().toISOString();

  const leadRecord = existingLead
    ? await base44.entities.Lead.update(existingLead.id, {
        ...payload,
        last_touch_at: now,
        source_channel: payload.source_channel || existingLead.source_channel,
        current_stage: existingLead.current_stage || 'new',
      })
    : await base44.entities.Lead.create({
        lead_code: buildLeadCode(),
        status: 'new',
        current_stage: 'new',
        ownership_status: 'unowned',
        first_touch_at: now,
        last_touch_at: now,
        source: payload.source || 'enquiry',
        ...payload,
      });

  const leadIdentities = await base44.entities.LeadIdentity.list('-updated_date', 200);
  const existingIdentity = leadIdentities.find((item) => item.lead_id === leadRecord.id && (
    item.email_normalised === normaliseEmail(payload.email) ||
    item.mobile_normalised === normalisePhone(payload.mobile) ||
    item.whatsapp_normalised === normalisePhone(payload.whatsapp)
  ));

  if (!existingIdentity) {
    await base44.entities.LeadIdentity.create({
      lead_id: leadRecord.id,
      email_normalised: normaliseEmail(payload.email),
      mobile_normalised: normalisePhone(payload.mobile),
      whatsapp_normalised: normalisePhone(payload.whatsapp),
      full_name: payload.full_name,
      country: payload.country,
      identity_confidence: existingLead ? 0.95 : 0.8,
      identity_source: payload.identity_source || 'form_submission',
      is_primary_identity: true,
    });
  }

  const leadAttributions = await base44.entities.LeadAttribution.list('-updated_date', 200);
  const existingAttribution = leadAttributions.find((item) => item.lead_id === leadRecord.id && item.session_id === attribution.session_id);

  if (!existingAttribution) {
    await base44.entities.LeadAttribution.create({
      lead_id: leadRecord.id,
      ...attribution,
      is_locked: false,
    });
  }

  await base44.entities.LeadEvent.create({
    lead_id: leadRecord.id,
    event_type: existingLead ? 'identity_linked' : 'lead_created',
    actor_type: 'buyer',
    session_id: attribution.session_id,
    summary: existingLead ? 'Anonymous session merged into identified lead.' : 'Lead created from high-intent action.',
    event_payload_json: payload,
  });

  await Promise.all(shortlists.filter((item) => item.session_id === attribution.session_id).map((item) => base44.entities.LeadEvent.create({
    lead_id: leadRecord.id,
    event_type: 'shortlist_linked',
    actor_type: 'system',
    session_id: attribution.session_id,
    summary: 'Anonymous shortlist state linked to lead.',
    event_payload_json: { shortlist_id: item.id, listing_ids: item.listing_ids },
  })));

  await Promise.all(compareSets.filter((item) => item.session_id === attribution.session_id).map((item) => base44.entities.LeadEvent.create({
    lead_id: leadRecord.id,
    event_type: 'compare_linked',
    actor_type: 'system',
    session_id: attribution.session_id,
    summary: 'Anonymous compare state linked to lead.',
    event_payload_json: { compare_set_id: item.id, listing_ids: item.listing_ids },
  })));

  if (payload.assigned_partner_id) {
    await base44.entities.Lead.update(leadRecord.id, {
      assigned_partner_id: payload.assigned_partner_id,
      ownership_status: 'soft_owned',
      current_stage: 'assigned',
      status: 'assigned',
    });
    await base44.entities.LeadAssignment.create({
      lead_id: leadRecord.id,
      assignment_type: 'manual',
      partner_id: payload.assigned_partner_id,
      assigned_at: now,
      assignment_status: 'pending',
      assignment_reason: 'Buyer intent routing',
      assigned_by: 'system',
      sla_due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    await createNotification({
      title: 'New lead assigned',
      body: `Lead ${leadRecord.lead_code} is ready for partner action.`,
    });
  }

  if (payload.is_high_value) {
    await createNotification({
      title: 'High-value lead',
      body: `Lead ${leadRecord.lead_code} requires priority handling.`,
    });
  }

  return leadRecord;
}

export async function mergeLeads(sourceLead, targetLead, reason) {
  await base44.entities.Lead.update(sourceLead.id, {
    status: 'merged',
    current_stage: 'merged',
    merged_into_lead_id: targetLead.id,
  });

  await base44.entities.LeadMergeLog.create({
    source_lead_id: sourceLead.id,
    target_lead_id: targetLead.id,
    merge_reason: reason,
    merged_by: 'internal_ops',
    merge_confidence: 0.9,
  });

  await base44.entities.LeadEvent.create({
    lead_id: sourceLead.id,
    event_type: 'identity_merged',
    actor_type: 'internal',
    summary: reason,
    event_payload_json: { target_lead_id: targetLead.id },
  });
}