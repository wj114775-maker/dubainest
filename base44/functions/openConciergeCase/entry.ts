import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function parseArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function slugify(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function buildCaseCode(caseType) {
  return `CC-${slugify(caseType).toUpperCase() || 'CASE'}-${Date.now().toString().slice(-8)}`;
}

function mergeText(...values) {
  return values.filter(Boolean).join(' | ');
}

function isMissingEntitySchemaError(error) {
  const message = String(error?.message || error?.detail || '');
  return message.includes('Entity schema') && message.includes('not found');
}

async function safeFilter(base44, entityName, query) {
  try {
    return await base44.asServiceRole.entities[entityName].filter(query);
  } catch (error) {
    if (isMissingEntitySchemaError(error)) return [];
    throw error;
  }
}

async function safeCreate(base44, entityName, payload) {
  try {
    return await base44.asServiceRole.entities[entityName].create(payload);
  } catch (error) {
    if (isMissingEntitySchemaError(error)) return null;
    throw error;
  }
}

async function safeUpdate(base44, entityName, id, payload) {
  try {
    return await base44.asServiceRole.entities[entityName].update(id, payload);
  } catch (error) {
    if (isMissingEntitySchemaError(error)) return null;
    throw error;
  }
}

function isClosedCase(caseRecord) {
  return ['closed_won', 'closed_lost', 'archived'].includes(caseRecord?.case_status || '');
}

function deriveCaseType(payload, lead) {
  if (payload.case_type) return payload.case_type;
  if (payload.is_family_office || lead?.decision_complexity === 'family_office') return 'family_office';
  if (payload.is_golden_visa_case || lead?.golden_visa_interest || lead?.intent_type === 'golden_visa') return 'golden_visa';
  if (payload.is_relocation_case || lead?.source === 'relocation') return 'relocation';
  if (payload.is_private_inventory || lead?.is_private_inventory || lead?.intent_type === 'request_private_inventory') return 'private_inventory';
  if (payload.is_hnw || lead?.is_high_value || toNumber(payload.budget_max || lead?.budget_max || 0) >= 5000000) return 'hnw';
  if (payload.service_tier === 'premium' || lead?.is_concierge) return 'concierge_premium';
  return 'concierge_standard';
}

function derivePriority(payload, lead, caseType) {
  if (payload.priority) return payload.priority;
  if (caseType === 'family_office' || caseType === 'hnw') return 'vip';
  if (caseType === 'private_inventory' || caseType === 'golden_visa') return 'premium';
  if (lead?.is_high_value) return 'priority';
  return 'standard';
}

function deriveServiceTier(payload, caseType) {
  if (payload.service_tier) return payload.service_tier;
  if (['family_office', 'hnw'].includes(caseType)) return 'hnw';
  if (caseType === 'private_inventory') return 'private_client';
  if (['golden_visa', 'relocation', 'concierge_premium'].includes(caseType)) return 'premium';
  return 'standard';
}

function deriveStatus(caseType, requiresNda, lead) {
  if (requiresNda) return 'nda_pending';
  if (caseType === 'private_inventory') return 'inventory_curation';
  if (lead?.status === 'qualified' || lead?.status === 'assigned' || lead?.status === 'accepted') return 'qualification_complete';
  return 'intake_in_progress';
}

function deriveConfidentiality(payload, caseType) {
  if (payload.confidentiality_level) return payload.confidentiality_level;
  if (['private_inventory', 'family_office', 'hnw'].includes(caseType)) return 'restricted_private';
  return 'confidential';
}

function deriveVisibility(caseType) {
  if (caseType === 'family_office' || caseType === 'hnw') return 'hnw_restricted';
  if (caseType === 'private_inventory') return 'restricted_private';
  return 'standard';
}

function buildDefaultMilestones(caseRecord, options) {
  const items = [
    { milestone_type: 'buyer_intake_complete', title: 'Buyer intake complete', status: 'pending' },
    { milestone_type: 'document_collection', title: 'Required documents collected', status: 'pending' },
    { milestone_type: 'inventory_strategy', title: caseRecord.is_private_inventory ? 'Private inventory curation complete' : 'Inventory curation complete', status: 'pending' },
    { milestone_type: 'viewing_plan', title: 'Viewing itinerary approved', status: 'pending' }
  ];

  if (options.requiresNda) {
    items.splice(1, 0, { milestone_type: 'nda_signed', title: 'NDA signed', status: 'pending' });
  }

  if (caseRecord.is_relocation_case) {
    items.push({ milestone_type: 'relocation_services', title: 'Relocation service pathway confirmed', status: 'pending' });
  }

  if (caseRecord.is_golden_visa_case) {
    items.push({ milestone_type: 'visa_pathway', title: 'Golden Visa eligibility pathway confirmed', status: 'pending' });
  }

  items.push({ milestone_type: 'deal_completion', title: 'Deal completed or transitioned', status: 'pending' });
  return items;
}

function buildDefaultTasks(caseRecord, lead, options) {
  const items = [
    {
      task_type: 'intake_call',
      title: 'Call buyer and confirm premium brief',
      description: mergeText(lead?.full_name ? `Buyer: ${lead.full_name}` : '', lead?.country ? `Country: ${lead.country}` : ''),
      priority: caseRecord.priority === 'vip' ? 'urgent' : 'high'
    },
    {
      task_type: 'document_request',
      title: 'Request premium client documents',
      description: options.requiredDocumentTypes.join(', ') || 'Collect proof of identity, funds, and decision-maker details.',
      priority: 'high'
    }
  ];

  if (options.requiresNda) {
    items.push({
      task_type: 'nda_follow_up',
      title: 'Send NDA and confirm signature window',
      description: 'Private inventory or restricted handling requires a signed NDA before release.',
      priority: 'urgent'
    });
  }

  items.push({
    task_type: 'inventory_strategy',
    title: caseRecord.is_private_inventory ? 'Shortlist private stock' : 'Curate property shortlist',
    description: caseRecord.property_objective || 'Prepare the initial curated inventory set.',
    priority: 'high'
  });

  if (caseRecord.is_relocation_case || caseRecord.is_golden_visa_case) {
    items.push({
      task_type: 'service_mapping',
      title: 'Map supporting services',
      description: 'Decide whether legal, visa, relocation, mortgage, or family support referrals are required.',
      priority: 'normal'
    });
  }

  return items;
}

async function createJourneyEvent(base44, caseId, eventType, summary, actorType, actorId, payloadJson = {}) {
  return base44.asServiceRole.entities.ClientJourneyEvent.create({
    case_id: caseId,
    event_type: eventType,
    summary,
    actor_type: actorType,
    actor_id: actorId || '',
    created_at: new Date().toISOString(),
    payload_json: payloadJson
  });
}

async function createNotification(base44, title, body, caseId, metadata = {}) {
  return base44.asServiceRole.entities.Notification.create({
    title,
    body,
    concierge_case_id: caseId,
    category: 'concierge',
    route_path: metadata.route_path || `/ops/concierge/${caseId}`,
    channel: 'in_app',
    status: 'queued',
    ...metadata
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;

    try {
      user = await base44.auth.me();
    } catch (_error) {
      user = null;
    }

    const payload = await req.json();
    const leadId = payload.lead_id || '';
    const lead = leadId ? await base44.asServiceRole.entities.Lead.get(leadId) : null;
    const caseType = deriveCaseType(payload, lead);
    const priority = derivePriority(payload, lead, caseType);
    const serviceTier = deriveServiceTier(payload, caseType);
    const actorId = user?.id || payload.created_by || lead?.user_id || '';
    const actorType = payload.source === 'partner' ? 'partner' : payload.source === 'internal' ? 'internal' : 'buyer';
    const preferredAreas = Array.from(new Set([
      ...parseArray(payload.preferred_areas),
      ...parseArray(lead?.preferred_area)
    ]));
    const requiredDocumentTypes = Array.from(new Set([
      ...parseArray(payload.required_document_types),
      caseType === 'private_inventory' ? 'nda' : '',
      lead?.golden_visa_interest || caseType === 'golden_visa' ? 'residency_documents' : '',
      caseType === 'hnw' || caseType === 'family_office' ? 'proof_of_funds' : '',
      'buyer_identity'
    ].filter(Boolean)));
    const requiresNda = Boolean(payload.requires_nda || payload.is_private_inventory || lead?.is_private_inventory || ['private_inventory', 'family_office', 'hnw'].includes(caseType));
    const now = new Date().toISOString();
    const buyerUserId = payload.buyer_user_id || lead?.user_id || '';
    const partnerId = payload.primary_partner_id || lead?.assigned_partner_id || lead?.partner_agency_id || '';
    const lookupCases = lead?.id
      ? await base44.asServiceRole.entities.ConciergeCase.filter({ lead_id: lead.id })
      : (buyerUserId ? await base44.asServiceRole.entities.ConciergeCase.filter({ buyer_user_id: buyerUserId }) : []);
    const existingCase = lookupCases.find((item) => !isClosedCase(item));
    const isPrivateInventory = Boolean(payload.is_private_inventory || lead?.is_private_inventory || caseType === 'private_inventory' || existingCase?.is_private_inventory);
    const isHnw = Boolean(payload.is_hnw || lead?.is_high_value || ['hnw', 'family_office'].includes(caseType) || existingCase?.is_hnw);
    const isFamilyOffice = Boolean(payload.is_family_office || caseType === 'family_office' || existingCase?.is_family_office);
    const isRelocationCase = Boolean(payload.is_relocation_case || caseType === 'relocation' || existingCase?.is_relocation_case);
    const isGoldenVisaCase = Boolean(payload.is_golden_visa_case || lead?.golden_visa_interest || caseType === 'golden_visa' || existingCase?.is_golden_visa_case);

    const baseCasePayload = {
      lead_id: lead?.id || leadId || existingCase?.lead_id || '',
      buyer_user_id: buyerUserId || existingCase?.buyer_user_id || '',
      case_type: caseType,
      case_status: payload.case_status || deriveStatus(caseType, requiresNda, lead),
      priority,
      service_tier: serviceTier,
      budget_min: toNumber(payload.budget_min ?? lead?.budget_min ?? existingCase?.budget_min ?? 0) || undefined,
      budget_max: toNumber(payload.budget_max ?? lead?.budget_max ?? existingCase?.budget_max ?? 0) || undefined,
      preferred_areas: preferredAreas,
      property_objective: payload.property_objective || lead?.buying_purpose || existingCase?.property_objective || '',
      buying_timeframe: payload.buying_timeframe || lead?.purchase_timeline || existingCase?.buying_timeframe || '',
      decision_complexity: payload.decision_complexity || existingCase?.decision_complexity || (payload.is_family_office ? 'family_office' : 'multi_stakeholder'),
      is_private_inventory: isPrivateInventory,
      is_hnw: isHnw,
      is_family_office: isFamilyOffice,
      is_relocation_case: isRelocationCase,
      is_golden_visa_case: isGoldenVisaCase,
      assigned_concierge_id: payload.assigned_concierge_id || existingCase?.assigned_concierge_id || '',
      assigned_internal_team: payload.assigned_internal_team || existingCase?.assigned_internal_team || 'concierge',
      primary_partner_id: partnerId,
      summary: payload.summary || mergeText(lead?.notes_summary, existingCase?.summary, payload.intent_type ? `Intent ${payload.intent_type}` : ''),
      special_instructions: mergeText(existingCase?.special_instructions, payload.special_instructions),
      confidentiality_level: deriveConfidentiality(payload, caseType),
      case_visibility: deriveVisibility(caseType),
      required_document_types: requiredDocumentTypes,
      sla_policy_code: payload.sla_policy_code || (['hnw', 'family_office'].includes(caseType) ? 'premium_2h' : caseType === 'private_inventory' ? 'private_inventory_4h' : 'concierge_8h'),
      sla_status: existingCase?.sla_status || 'on_track',
      next_sla_due_at: existingCase?.next_sla_due_at || new Date(Date.now() + (priority === 'vip' ? 2 : priority === 'premium' ? 4 : 8) * 60 * 60 * 1000).toISOString(),
      last_client_touch_at: now,
      last_internal_touch_at: existingCase?.last_internal_touch_at || now,
      opened_at: existingCase?.opened_at || now,
      tags: Array.from(new Set([
        ...parseArray(existingCase?.tags),
        caseType,
        isPrivateInventory ? 'private_inventory' : '',
        isHnw ? 'hnw' : '',
        isGoldenVisaCase ? 'golden_visa' : '',
        isRelocationCase ? 'relocation' : ''
      ].filter(Boolean)))
    };

    const caseRecord = existingCase
      ? await base44.asServiceRole.entities.ConciergeCase.update(existingCase.id, baseCasePayload)
      : await base44.asServiceRole.entities.ConciergeCase.create({
          case_code: buildCaseCode(caseType),
          ...baseCasePayload
        });

    const milestones = await safeFilter(base44, 'ConciergeMilestone', { case_id: caseRecord.id });
    const tasks = await safeFilter(base44, 'ConciergeTask', { case_id: caseRecord.id });
    const participants = await safeFilter(base44, 'CaseParticipant', { case_id: caseRecord.id });
    const ndaRecords = await safeFilter(base44, 'NDATracking', { case_id: caseRecord.id });
    const inventoryRequests = await safeFilter(base44, 'PrivateInventoryRequest', { case_id: caseRecord.id });
    const preferences = await safeFilter(base44, 'ClientPreferenceProfile', { case_id: caseRecord.id });

    const milestoneTemplates = buildDefaultMilestones(caseRecord, { requiresNda });
    const existingMilestoneTypes = new Set(milestones.map((item) => item.milestone_type));
    const newMilestones = (await Promise.all(milestoneTemplates
      .filter((item) => !existingMilestoneTypes.has(item.milestone_type))
      .map((item) => safeCreate(base44, 'ConciergeMilestone', {
        case_id: caseRecord.id,
        ...item
      })))).filter(Boolean);

    const taskTemplates = buildDefaultTasks(caseRecord, lead, { requiresNda, requiredDocumentTypes });
    const existingTaskTitles = new Set(tasks.map((item) => item.title));
    const newTasks = (await Promise.all(taskTemplates
      .filter((item) => !existingTaskTitles.has(item.title))
      .map((item) => safeCreate(base44, 'ConciergeTask', {
        case_id: caseRecord.id,
        status: 'open',
        visibility: 'internal_only',
        created_by: actorId,
        ...item
      })))).filter(Boolean);

    let buyerParticipant = participants.find((item) => item.participant_type === 'buyer');
    if (!buyerParticipant && (lead?.full_name || payload.full_name)) {
      buyerParticipant = await safeCreate(base44, 'CaseParticipant', {
        case_id: caseRecord.id,
        participant_type: 'buyer',
        name: payload.full_name || lead?.full_name || 'Premium buyer',
        email: payload.email || lead?.email || '',
        phone: payload.mobile || payload.whatsapp || lead?.mobile || lead?.whatsapp || '',
        organisation: payload.organisation || '',
        role_in_case: 'Primary buyer',
        linked_user_id: buyerUserId,
        is_primary: true,
        notes: payload.country || lead?.country || ''
      });
    }

    let ndaRecord = ndaRecords[0] || null;
    if (requiresNda && !ndaRecord) {
      ndaRecord = await safeCreate(base44, 'NDATracking', {
        case_id: caseRecord.id,
        nda_status: 'pending',
        required_for: caseType === 'private_inventory' ? 'private_inventory_release' : 'premium_case_handling',
        notes: 'Auto-created when the concierge case opened.'
      });
    }

    let inventoryRequest = inventoryRequests.find((item) => !['fulfilled', 'rejected', 'revoked'].includes(item.request_status)) || null;
    if (caseRecord.is_private_inventory && !inventoryRequest) {
      inventoryRequest = await safeCreate(base44, 'PrivateInventoryRequest', {
        case_id: caseRecord.id,
        lead_id: caseRecord.lead_id || '',
        request_status: requiresNda ? 'nda_required' : 'under_review',
        request_scope: payload.request_scope || 'private_inventory_shortlist',
        requested_by: actorId,
        assigned_to: caseRecord.assigned_concierge_id || '',
        request_summary: payload.request_summary || payload.summary || 'Private inventory access requested.',
        confidentiality_level: caseRecord.confidentiality_level || 'restricted_private',
        opened_at: now,
        notes: payload.special_instructions || ''
      });
    }

    const preferencePayload = {
      lifestyle_preferences_json: payload.lifestyle_preferences_json || {},
      risk_profile: payload.risk_profile || (lead?.buying_purpose === 'investor' ? 'investment_focused' : 'balanced'),
      investment_preferences_json: payload.investment_preferences_json || {},
      family_requirements_json: payload.family_requirements_json || {},
      must_have_features_json: payload.must_have_features_json || {},
      deal_breakers_json: payload.deal_breakers_json || {},
      travel_preferences_json: payload.travel_preferences_json || {},
      service_needs_json: payload.service_needs_json || {},
      privacy_expectations_json: payload.privacy_expectations_json || {}
    };

    const preferenceRecord = preferences[0]
      ? await safeUpdate(base44, 'ClientPreferenceProfile', preferences[0].id, preferencePayload)
      : await safeCreate(base44, 'ClientPreferenceProfile', {
          case_id: caseRecord.id,
          ...preferencePayload
        });

    const eventType = existingCase ? 'concierge_case_upgraded' : 'concierge_case_opened';
    await createJourneyEvent(
      base44,
      caseRecord.id,
      eventType,
      existingCase ? 'Premium case updated from a new trigger.' : 'Premium case opened from buyer or routing intent.',
      actorType,
      actorId,
      {
        lead_id: caseRecord.lead_id,
        case_type: caseRecord.case_type,
        intent_type: payload.intent_type || lead?.intent_type || '',
        source: payload.source || 'buyer_intent',
        requires_nda: requiresNda,
        private_inventory_request_id: inventoryRequest?.id || ''
      }
    );

    await createNotification(
      base44,
      caseRecord.is_hnw ? 'HNW concierge case opened' : 'Concierge case opened',
      `${caseRecord.case_code} is ready for premium handling.`,
      caseRecord.id
    );

    if (requiresNda) {
      await createNotification(
        base44,
        'NDA pending',
        `${caseRecord.case_code} requires NDA handling before restricted material is shared.`,
        caseRecord.id,
        { nda_tracking_id: ndaRecord?.id || '' }
      );
    }

    await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'ConciergeCase',
      entity_id: caseRecord.id,
      action: existingCase ? 'concierge_case_upgraded' : 'concierge_case_created',
      actor_id: actorId || 'anonymous',
      actor_user_id: actorId || '',
      summary: existingCase ? 'Concierge case upgraded from a subsequent trigger.' : 'Concierge case created.',
      immutable: true,
      scope: 'concierge',
      metadata: {
        lead_id: caseRecord.lead_id,
        buyer_user_id: caseRecord.buyer_user_id,
        case_type: caseRecord.case_type,
        case_status: caseRecord.case_status,
        private_inventory_request_id: inventoryRequest?.id || '',
        nda_tracking_id: ndaRecord?.id || '',
        preference_profile_id: preferenceRecord?.id || ''
      }
    });

    return Response.json({
      case: caseRecord,
      nda: ndaRecord,
      inventoryRequest,
      participant: buyerParticipant,
      milestones: newMilestones,
      tasks: newTasks,
      preferences: preferenceRecord
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
