import { base44 } from '@/api/base44Client';
import { rankEligiblePartners, summariseRoutingReason } from '@/lib/partnerRouting';

function getComparableValue(record, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), record);
}

function matchesCondition(record, condition = {}) {
  const { field, operator = 'equals', value } = condition;
  const current = getComparableValue(record, field || '');

  if (operator === 'exists') return current !== undefined && current !== null && current !== '';
  if (operator === 'not_exists') return current === undefined || current === null || current === '';
  if (operator === 'contains') return Array.isArray(current) ? current.includes(value) : String(current || '').toLowerCase().includes(String(value || '').toLowerCase());
  if (operator === 'in') return Array.isArray(value) ? value.includes(current) : false;
  if (operator === 'gte') return Number(current || 0) >= Number(value || 0);
  if (operator === 'lte') return Number(current || 0) <= Number(value || 0);
  if (operator === 'gt') return Number(current || 0) > Number(value || 0);
  if (operator === 'lt') return Number(current || 0) < Number(value || 0);
  if (operator === 'not_equals') return current !== value;
  return String(current ?? '') === String(value ?? '');
}

function evaluateRuleConditions(record, conditions = {}) {
  const conditionList = Array.isArray(conditions.conditions) ? conditions.conditions : [];
  const branchList = Array.isArray(conditions.branches) ? conditions.branches : [];

  const baseMatched = !conditionList.length ? true : ((conditions.logic === 'or' ? 'or' : 'and') === 'or'
    ? conditionList.map((condition) => matchesCondition(record, condition)).some(Boolean)
    : conditionList.map((condition) => matchesCondition(record, condition)).every(Boolean));

  if (!baseMatched) return { matched: false, branch: null };
  if (!branchList.length) return { matched: true, branch: null };

  const matchedBranch = branchList.find((branch) => {
    const branchConditions = Array.isArray(branch.conditions) ? branch.conditions : [];
    if (!branchConditions.length) return false;
    const branchLogic = branch.logic === 'or' ? 'or' : 'and';
    const branchResults = branchConditions.map((condition) => matchesCondition(record, condition));
    return branchLogic === 'or' ? branchResults.some(Boolean) : branchResults.every(Boolean);
  });

  return { matched: true, branch: matchedBranch || null };
}

function applyRuleActions(lead, actions = {}, context = {}) {
  const resolvedActions = context.branch?.actions || actions;
  const updates = {};
  const sideEffects = { createWindow: null, createAlert: null, assignment: null, notifications: [], escalation: null };

  if (resolvedActions.set_priority) updates.priority = resolvedActions.set_priority;
  if (resolvedActions.set_stage) updates.current_stage = resolvedActions.set_stage;
  if (resolvedActions.set_status) updates.status = resolvedActions.set_status;
  if (resolvedActions.set_ownership_status) updates.ownership_status = resolvedActions.set_ownership_status;
  if (resolvedActions.assign_partner_id) updates.assigned_partner_id = resolvedActions.assign_partner_id;
  if (resolvedActions.lock_hours) {
    const protectedUntil = new Date(Date.now() + Number(resolvedActions.lock_hours) * 60 * 60 * 1000).toISOString();
    updates.protected_until = protectedUntil;
    updates.ownership_status = resolvedActions.set_ownership_status || 'protected';
    sideEffects.createWindow = {
      protected_until: protectedUntil,
      lock_reason: resolvedActions.lock_reason || context.rule?.name || 'Rule lock applied'
    };
  }
  if (resolvedActions.sla_minutes) {
    sideEffects.assignment = {
      sla_due_at: new Date(Date.now() + Number(resolvedActions.sla_minutes) * 60 * 1000).toISOString(),
      assignment_reason: resolvedActions.assignment_reason || context.rule?.name || 'Rule-based routing'
    };
  }
  if (resolvedActions.open_circumvention_alert) {
    updates.is_circumvention_flagged = true;
    sideEffects.createAlert = {
      severity: resolvedActions.alert_severity || 'high',
      summary: resolvedActions.alert_summary || `${context.rule?.name || 'Rule'} opened a circumvention review.`,
      status: resolvedActions.escalate_immediately ? 'escalated' : 'reviewing'
    };
  }
  if (resolvedActions.escalate_lead || resolvedActions.escalate_immediately) {
    updates.status = resolvedActions.escalated_status || updates.status || 'disputed';
    updates.current_stage = resolvedActions.escalated_stage || updates.current_stage || 'disputed';
    sideEffects.escalation = {
      severity: resolvedActions.escalation_severity || resolvedActions.alert_severity || 'high',
      summary: resolvedActions.escalation_summary || `${context.rule?.name || 'Rule'} escalated the lead for review.`
    };
  }
  if (resolvedActions.notify_title) {
    sideEffects.notifications.push({
      title: resolvedActions.notify_title,
      body: resolvedActions.notify_body || `Lead ${lead.lead_code || lead.id} was updated by rule execution.`
    });
  }

  return { updates, sideEffects, appliedActions: resolvedActions };
}

function buildDefaultRule(record, preferredPartnerId) {
  return {
    updates: {
      assigned_partner_id: preferredPartnerId,
      ownership_status: record.is_private_inventory || record.is_high_value ? 'protected' : 'soft_owned',
      current_stage: 'assigned',
      status: 'assigned',
      protected_until: record.is_private_inventory || record.is_high_value ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() : record.protected_until,
    },
    assignment: preferredPartnerId ? {
      partner_id: preferredPartnerId,
      assignment_type: record.is_private_inventory || record.is_concierge ? 'rule_based' : 'round_robin',
      assignment_reason: record.routing_reason || (record.is_private_inventory ? 'Private inventory routing' : record.is_concierge ? 'Concierge routing' : record.buying_purpose === 'investor' ? 'Investor routing' : 'Buyer intent routing'),
      sla_due_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    } : null,
    window: record.is_private_inventory || record.is_high_value ? {
      protected_until: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      lock_reason: record.is_private_inventory ? 'Private inventory protected window' : 'High value lead protected window'
    } : null
  };
}

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

export async function findExistingLead({ email, mobile, whatsapp, full_name }) {
  const identities = await base44.entities.LeadIdentity.list('-updated_date', 200);
  const emailNormalised = normaliseEmail(email);
  const mobileNormalised = normalisePhone(mobile);
  const whatsappNormalised = normalisePhone(whatsapp);
  const nameNormalised = full_name?.trim().toLowerCase() || '';

  const scored = identities.map((item) => {
    let score = 0;
    if (emailNormalised && item.email_normalised === emailNormalised) score += 0.55;
    if (mobileNormalised && item.mobile_normalised === mobileNormalised) score += 0.3;
    if (whatsappNormalised && item.whatsapp_normalised === whatsappNormalised) score += 0.3;
    if (nameNormalised && item.full_name?.trim().toLowerCase() === nameNormalised) score += 0.15;
    return { item, score };
  }).filter((item) => item.score >= 0.3).sort((a, b) => b.score - a.score);

  const matched = scored[0]?.item;
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
  const rules = await base44.entities.LeadProtectionRule.list('-updated_date', 200);
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

  const [partnerAgencies, assignments] = await Promise.all([
    base44.entities.PartnerAgency.list('-updated_date', 200),
    base44.entities.LeadAssignment.list('-updated_date', 500)
  ]);
  const partnerMetrics = partnerAgencies.reduce((acc, partner) => {
    const partnerAssignments = assignments.filter((item) => item.partner_id === partner.id);
    const pendingCount = partnerAssignments.filter((item) => item.assignment_status === 'pending').length;
    const acceptedCount = partnerAssignments.filter((item) => item.assignment_status === 'accepted').length;
    const rejectedCount = partnerAssignments.filter((item) => item.assignment_status === 'rejected').length;
    const breachedCount = partnerAssignments.filter((item) => item.sla_status === 'breached' || item.assignment_status === 'expired').length;
    const capacityLimit = Number(partner.capacity_limit || 0);
    const usagePenalty = capacityLimit > 0 ? Math.max(0, pendingCount - capacityLimit) * 25 : pendingCount * 15;
    acc[partner.id] = {
      capacityScore: Math.max(0, 100 - usagePenalty),
      performanceScore: Math.max(0, Number(partner.performance_score ?? (60 + acceptedCount * 8 - rejectedCount * 12 - breachedCount * 15))),
      responsivenessScore: Math.max(0, Number(partner.response_score ?? (100 - breachedCount * 20)))
    };
    return acc;
  }, {});
  const rankedPartners = rankEligiblePartners(partnerAgencies, { ...leadRecord, ...payload }, partnerMetrics);
  const preferredPartner = rankedPartners[0]?.partner || null;
  const routingReason = rankedPartners[0]?.routingReason || summariseRoutingReason({ partner: preferredPartner || partnerAgencies[0] || {}, lead: { ...leadRecord, ...payload }, metrics: partnerMetrics[preferredPartner?.id] || {}, mode: 'fallback_routing' });
  const preferredPartnerId = payload.assigned_partner_id || leadRecord.assigned_partner_id || preferredPartner?.id || partnerAgencies[0]?.id;
  const runtimeRecord = {
    ...leadRecord,
    ...payload,
    trigger_event: existingLead ? 'lead_updated' : 'lead_created',
    preferred_partner_id: preferredPartnerId,
    routing_reason: routingReason,
    is_existing_lead: Boolean(existingLead)
  };

  const activeRules = rules.filter((rule) => rule.status === 'active').sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999));
  const evaluationResults = activeRules.map((rule) => {
    const evaluation = evaluateRuleConditions(runtimeRecord, rule.conditions || {});
    const execution = evaluation.matched ? applyRuleActions(leadRecord, rule.actions || {}, { rule, payload, preferredPartnerId, branch: evaluation.branch }) : { updates: {}, sideEffects: { createWindow: null, createAlert: null, assignment: null, notifications: [], escalation: null }, appliedActions: {} };
    return {
      rule,
      matched: evaluation.matched,
      branch: evaluation.branch,
      updates: execution.updates,
      sideEffects: execution.sideEffects,
      appliedActions: execution.appliedActions
    };
  });

  const matchedRules = evaluationResults.filter((item) => item.matched);
  const matchedRuleIds = matchedRules.map((item) => item.rule.id);
  const finalUpdates = {};
  let finalAssignment = null;
  let finalWindow = null;
  let finalAlert = null;
  let finalEscalation = null;
  const finalNotifications = [];

  matchedRules.forEach((item) => {
    Object.assign(finalUpdates, item.updates);
    if (item.sideEffects.assignment && !finalAssignment) {
      finalAssignment = {
        partner_id: item.updates.assigned_partner_id || preferredPartnerId,
        assignment_type: 'rule_based',
        ...item.sideEffects.assignment
      };
    }
    if (item.sideEffects.createWindow && !finalWindow) finalWindow = item.sideEffects.createWindow;
    if (item.sideEffects.createAlert && !finalAlert) finalAlert = item.sideEffects.createAlert;
    if (item.sideEffects.escalation && !finalEscalation) finalEscalation = item.sideEffects.escalation;
    if (item.sideEffects.notifications?.length) finalNotifications.push(...item.sideEffects.notifications);
  });

  if (!matchedRules.length) {
    const fallback = buildDefaultRule(runtimeRecord, preferredPartnerId);
    Object.assign(finalUpdates, fallback.updates);
    finalAssignment = fallback.assignment;
    finalWindow = fallback.window;
    finalNotifications.push({ title: 'New lead assigned', body: `Lead ${leadRecord.lead_code} is ready for partner action.` });
  }

  if (finalUpdates.assigned_partner_id) leadRecord.assigned_partner_id = finalUpdates.assigned_partner_id;
  const updatedLead = Object.keys(finalUpdates).length ? await base44.entities.Lead.update(leadRecord.id, finalUpdates) : leadRecord;

  if (finalAssignment?.partner_id) {
    await base44.entities.LeadAssignment.create({
      lead_id: leadRecord.id,
      partner_id: finalAssignment.partner_id,
      assignment_type: finalAssignment.assignment_type || 'rule_based',
      assigned_at: now,
      assignment_status: 'pending',
      assignment_reason: finalAssignment.assignment_reason,
      assigned_by: 'system',
      sla_due_at: finalAssignment.sla_due_at,
    });
  }

  if (finalWindow?.protected_until) {
    await base44.entities.LeadProtectionWindow.create({
      lead_id: leadRecord.id,
      rule_id: matchedRules.find((item) => item.sideEffects.createWindow)?.rule.id,
      lock_reason: finalWindow.lock_reason,
      locked_at: now,
      protected_until: finalWindow.protected_until,
      status: 'active',
    });
  }

  if (finalAlert) {
    await base44.entities.CircumventionAlert.create({
      lead_id: leadRecord.id,
      partner_id: updatedLead.assigned_partner_id,
      alert_type: 'rule_triggered_review',
      severity: finalAlert.severity,
      summary: finalAlert.summary,
      evidence_json: { source: payload.source, trigger_event: runtimeRecord.trigger_event, escalation: finalEscalation },
      status: finalAlert.status || 'reviewing'
    });
  }

  await Promise.all(activeRules.map((rule) => {
    const result = evaluationResults.find((item) => item.rule.id === rule.id);
    return base44.entities.LeadRuleEvaluation.create({
      lead_id: leadRecord.id,
      rule_id: rule.id,
      trigger_event: runtimeRecord.trigger_event,
      matched: result?.matched || false,
      evaluation_payload_json: { source: payload.source, priority: payload.priority, budget_max: payload.budget_max, country: payload.country, preferred_partner_id: preferredPartnerId },
      result_payload_json: {
        rule_type: rule.rule_type,
        actions: rule.actions || {},
        applied_actions: result?.appliedActions || {},
        applied_branch: result?.branch?.name || null,
        applied_updates: result?.updates || {},
        matched_partner_id: (result?.updates.assigned_partner_id || finalAssignment?.partner_id || ''),
        result: result?.matched ? 'executed' : 'not_matched',
        execution_order: activeRules.findIndex((item) => item.id === rule.id) + 1,
        won_priority: matchedRules[0]?.rule.id === rule.id,
        matched_rule_ids: matchedRuleIds,
        chained_after_rule_id: result?.matched ? matchedRules[matchedRules.findIndex((item) => item.rule.id === rule.id) - 1]?.rule.id || null : null,
        conflict_resolution: result?.matched ? (matchedRules[0]?.rule.id === rule.id ? 'won_by_priority' : 'applied_after_higher_priority_rule') : 'not_applicable',
        routing_reason: result?.matched ? (result?.updates.assigned_partner_id || finalAssignment?.partner_id ? routingReason : null) : null,
        ranked_partner_ids: rankedPartners.map((item) => item.partner.id)
      },
    });
  }));

  await Promise.all(finalNotifications.map((item) => createNotification({
    title: item.title,
    body: item.body,
    lead_id: leadRecord.id
  })));

  if (payload.is_high_value && !finalNotifications.find((item) => item.title === 'High-value lead')) {
    await createNotification({
      title: 'High-value lead',
      body: `Lead ${leadRecord.lead_code} requires priority handling.`,
      lead_id: leadRecord.id
    });
  }

  await base44.entities.AuditLog.create({
    organisation_id: updatedLead.organisation_id,
    entity_name: 'Lead',
    entity_id: leadRecord.id,
    action: 'lead_rules_executed',
    actor_id: 'system',
    summary: matchedRules.length ? `Lead rules executed: ${matchedRules.map((item) => item.rule.name).join(', ')}` : 'Lead rules executed with fallback routing',
    reason: routingReason,
    immutable: true,
    scope: 'lead',
    metadata: {
      trigger_event: runtimeRecord.trigger_event,
      matched_rule_ids: matchedRuleIds,
      applied_updates: finalUpdates,
      assignment_partner_id: finalAssignment?.partner_id || null,
      priority_winner_rule_id: matchedRules[0]?.rule.id || null,
      rule_chain: matchedRules.map((item) => item.rule.id),
      escalation_summary: finalEscalation?.summary || null
    }
  });

  return updatedLead;
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