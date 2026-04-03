import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function hasPermission(user, assignments, requiredPermissions = []) {
  if (user?.role === 'admin') return true;
  const granted = new Set(assignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]));
  return requiredPermissions.some((permission) => granted.has(permission));
}

function mergeText(...values) {
  return values.filter(Boolean).join(' | ');
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function parseObject(value, fallback = {}) {
  return value && typeof value === 'object' ? value : fallback;
}

function resolveDate(value, fallback = '') {
  if (!value) return fallback;
  return new Date(value).toISOString();
}

function closedStatus(value) {
  return ['closed_won', 'closed_lost', 'archived'].includes(value || '');
}

async function createJourneyEvent(base44, caseId, eventType, summary, actorId, payloadJson = {}) {
  return base44.asServiceRole.entities.ClientJourneyEvent.create({
    case_id: caseId,
    event_type: eventType,
    summary,
    actor_type: 'internal',
    actor_id: actorId,
    created_at: new Date().toISOString(),
    payload_json: payloadJson
  });
}

async function notifyPartnerUsers(base44, partnerId, title, body, metadata = {}) {
  if (!partnerId) return null;
  const profiles = await base44.asServiceRole.entities.PartnerUserProfile.filter({ partner_agency_id: partnerId });
  if (!profiles.length) {
    return base44.asServiceRole.entities.Notification.create({
      title,
      body,
      category: 'concierge',
      channel: 'in_app',
      status: 'queued',
      ...metadata
    });
  }
  return Promise.all(profiles.map((profile) => base44.asServiceRole.entities.Notification.create({
    user_id: profile.user_id,
    title,
    body,
    category: 'concierge',
    channel: 'in_app',
    status: 'queued',
    ...metadata
  })));
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
    const payload = await req.json();
    const {
      action = '',
      case_id = '',
      milestone_id = '',
      task_id = '',
      nda_id = '',
      private_inventory_request_id = '',
      referral_id = '',
      viewing_plan_id = '',
      viewing_stop_id = '',
      title = '',
      description = '',
      summary = '',
      content = '',
      notes = '',
      case_status = '',
      priority = '',
      assigned_to = '',
      assigned_concierge_id = '',
      assigned_internal_team = '',
      due_date = '',
      milestone_type = '',
      task_type = '',
      participant_type = 'other',
      name = '',
      email = '',
      phone = '',
      organisation = '',
      role_in_case = '',
      service_type = '',
      partner_id = '',
      status = '',
      request_scope = '',
      request_summary = '',
      confidentiality_level = '',
      file_url = '',
      document_type = '',
      visibility = 'internal_only',
      security_level = 'standard',
      required_for = '',
      date_start = '',
      date_end = '',
      city = 'Dubai',
      approved_by_client = false,
      scheduled_at = '',
      listing_id = '',
      meeting_point = '',
      duration_minutes = 60,
      area_label = '',
      note_type = 'internal_update',
      risk_profile = '',
      lifestyle_preferences_json = {},
      investment_preferences_json = {},
      family_requirements_json = {},
      must_have_features_json = {},
      deal_breakers_json = {},
      travel_preferences_json = {},
      service_needs_json = {},
      privacy_expectations_json = {}
    } = payload;

    if (!action || !case_id) {
      return Response.json({ error: 'action and case_id are required' }, { status: 400 });
    }

    const actionPermissionMap = {
      assign_concierge: ['concierge_cases.manage'],
      change_priority: ['concierge_cases.manage'],
      update_status: ['concierge_cases.manage'],
      add_milestone: ['concierge_cases.manage'],
      complete_milestone: ['concierge_cases.manage'],
      add_task: ['concierge_tasks.manage'],
      update_task: ['concierge_tasks.manage'],
      complete_task: ['concierge_tasks.manage'],
      upload_document: ['concierge_documents.manage'],
      send_nda: ['nda.manage'],
      mark_nda_received: ['nda.manage'],
      request_private_inventory: ['private_inventory.manage'],
      resolve_private_inventory: ['private_inventory.manage'],
      create_viewing_plan: ['viewing_plans.manage'],
      add_viewing_stop: ['viewing_plans.manage'],
      update_viewing_stop: ['viewing_plans.manage'],
      add_service_referral: ['service_referrals.manage'],
      update_service_referral: ['service_referrals.manage'],
      add_participant: ['concierge_cases.manage'],
      add_note: ['concierge_cases.manage'],
      update_preferences: ['concierge_cases.manage'],
      close_case: ['concierge_cases.manage'],
      escalate_case: ['hnw_cases.manage', 'concierge_cases.manage']
    };

    if (!hasPermission(user, activeAssignments, actionPermissionMap[action] || ['concierge_cases.manage'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const caseRecord = await base44.asServiceRole.entities.ConciergeCase.get(case_id);
    if (!caseRecord) {
      return Response.json({ error: 'Concierge case not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const result = {
      case: caseRecord,
      milestone: null,
      task: null,
      nda: null,
      inventoryRequest: null,
      referral: null,
      viewingPlan: null,
      viewingStop: null,
      document: null,
      participant: null,
      note: null,
      preferences: null
    };

    if (action === 'assign_concierge') {
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        assigned_concierge_id: assigned_concierge_id || caseRecord.assigned_concierge_id || '',
        assigned_internal_team: assigned_internal_team || caseRecord.assigned_internal_team || 'concierge',
        case_status: caseRecord.case_status === 'new' ? 'intake_in_progress' : caseRecord.case_status,
        last_internal_touch_at: now
      });
    }

    if (action === 'change_priority') {
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        priority: priority || caseRecord.priority,
        last_internal_touch_at: now
      });
    }

    if (action === 'update_status') {
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: case_status || status || caseRecord.case_status,
        closed_at: closedStatus(case_status || status) ? now : caseRecord.closed_at || '',
        last_internal_touch_at: now
      });
    }

    if (action === 'add_milestone') {
      result.milestone = await base44.asServiceRole.entities.ConciergeMilestone.create({
        case_id,
        milestone_type: milestone_type || 'custom_milestone',
        title: title || 'Custom milestone',
        status: status || 'pending',
        due_date: resolveDate(due_date),
        notes
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_internal_touch_at: now });
    }

    if (action === 'complete_milestone') {
      if (!milestone_id) {
        return Response.json({ error: 'milestone_id is required' }, { status: 400 });
      }
      result.milestone = await base44.asServiceRole.entities.ConciergeMilestone.update(milestone_id, {
        status: 'completed',
        completed_at: now,
        completed_by: user.id,
        notes
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_internal_touch_at: now });
    }

    if (action === 'add_task') {
      result.task = await base44.asServiceRole.entities.ConciergeTask.create({
        case_id,
        task_type: task_type || 'custom_task',
        title: title || 'Concierge task',
        description,
        assigned_to: assigned_to || '',
        priority: priority || 'normal',
        status: status || 'open',
        due_date: resolveDate(due_date),
        visibility,
        created_by: user.id
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_internal_touch_at: now });
    }

    if (action === 'update_task' || action === 'complete_task') {
      if (!task_id) {
        return Response.json({ error: 'task_id is required' }, { status: 400 });
      }
      const nextStatus = action === 'complete_task' ? 'completed' : (status || 'in_progress');
      result.task = await base44.asServiceRole.entities.ConciergeTask.update(task_id, {
        title: title || undefined,
        description: description || undefined,
        assigned_to: assigned_to || undefined,
        priority: priority || undefined,
        status: nextStatus,
        due_date: due_date ? resolveDate(due_date) : undefined,
        completed_at: nextStatus === 'completed' ? now : undefined,
        completed_by: nextStatus === 'completed' ? user.id : undefined
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_internal_touch_at: now });
    }

    if (action === 'upload_document') {
      result.document = await base44.asServiceRole.entities.SecureDocument.create({
        case_id,
        nda_id: nda_id || '',
        document_type: document_type || 'supporting_document',
        title: title || document_type || 'Case document',
        file_url,
        visibility,
        uploaded_by: user.id,
        uploaded_at: now,
        security_level,
        notes
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        last_internal_touch_at: now,
        case_visibility: security_level === 'hnw' ? 'hnw_restricted' : caseRecord.case_visibility
      });
    }

    if (action === 'send_nda') {
      const existingNda = nda_id
        ? await base44.asServiceRole.entities.NDATracking.get(nda_id)
        : (await base44.asServiceRole.entities.NDATracking.filter({ case_id }))[0];
      result.nda = existingNda
        ? await base44.asServiceRole.entities.NDATracking.update(existingNda.id, {
            nda_status: 'sent',
            required_for: required_for || existingNda.required_for || 'premium_case_handling',
            sent_at: now,
            document_url: file_url || existingNda.document_url || '',
            notes: mergeText(existingNda.notes, notes),
            sent_by: user.id
          })
        : await base44.asServiceRole.entities.NDATracking.create({
            case_id,
            nda_status: 'sent',
            required_for: required_for || 'premium_case_handling',
            sent_at: now,
            document_url: file_url || '',
            notes,
            sent_by: user.id
          });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: 'nda_pending',
        last_internal_touch_at: now
      });
      if (caseRecord.buyer_user_id) {
        await base44.asServiceRole.entities.Notification.create({
          user_id: caseRecord.buyer_user_id,
          title: 'NDA sent',
          body: `${caseRecord.case_code} has an NDA ready for review.`,
          concierge_case_id: caseRecord.id,
          nda_tracking_id: result.nda.id,
          category: 'concierge',
          route_path: '/account',
          channel: 'in_app',
          status: 'queued'
        });
      }
    }

    if (action === 'mark_nda_received') {
      const existingNda = nda_id
        ? await base44.asServiceRole.entities.NDATracking.get(nda_id)
        : (await base44.asServiceRole.entities.NDATracking.filter({ case_id }))[0];
      if (!existingNda) {
        return Response.json({ error: 'NDA record not found' }, { status: 404 });
      }
      result.nda = await base44.asServiceRole.entities.NDATracking.update(existingNda.id, {
        nda_status: 'signed',
        signed_at: now,
        notes: mergeText(existingNda.notes, notes),
        signed_by: user.id,
        document_url: file_url || existingNda.document_url || ''
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: caseRecord.case_status === 'nda_pending' ? 'ready_for_matching' : caseRecord.case_status,
        last_internal_touch_at: now,
        last_client_touch_at: now
      });
    }

    if (action === 'request_private_inventory') {
      result.inventoryRequest = await base44.asServiceRole.entities.PrivateInventoryRequest.create({
        case_id,
        lead_id: caseRecord.lead_id || '',
        request_status: status || 'under_review',
        request_scope: request_scope || 'private_inventory_shortlist',
        requested_by: user.id,
        assigned_to: assigned_to || caseRecord.assigned_concierge_id || '',
        request_summary: request_summary || summary || 'Private inventory access requested.',
        confidentiality_level: confidentiality_level || caseRecord.confidentiality_level || 'restricted_private',
        opened_at: now,
        notes
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: 'inventory_curation',
        is_private_inventory: true,
        last_internal_touch_at: now
      });
    }

    if (action === 'resolve_private_inventory') {
      const inventoryRecord = private_inventory_request_id
        ? await base44.asServiceRole.entities.PrivateInventoryRequest.get(private_inventory_request_id)
        : (await base44.asServiceRole.entities.PrivateInventoryRequest.filter({ case_id }))[0];
      if (!inventoryRecord) {
        return Response.json({ error: 'Private inventory request not found' }, { status: 404 });
      }
      result.inventoryRequest = await base44.asServiceRole.entities.PrivateInventoryRequest.update(inventoryRecord.id, {
        request_status: status || 'approved_for_release',
        resolved_at: now,
        resolved_by: user.id,
        notes: mergeText(inventoryRecord.notes, notes)
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: status === 'shared' ? 'active_service' : caseRecord.case_status,
        last_internal_touch_at: now
      });
    }

    if (action === 'create_viewing_plan') {
      result.viewingPlan = await base44.asServiceRole.entities.ViewingPlan.create({
        case_id,
        title: title || 'Client itinerary',
        status: status || 'draft',
        date_start: resolveDate(date_start),
        date_end: resolveDate(date_end),
        city,
        notes,
        approved_by_client: Boolean(approved_by_client),
        approved_at: approved_by_client ? now : '',
        created_by: user.id
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: 'viewing_planning',
        last_internal_touch_at: now
      });
    }

    if (action === 'add_viewing_stop') {
      if (!viewing_plan_id) {
        return Response.json({ error: 'viewing_plan_id is required' }, { status: 400 });
      }
      result.viewingStop = await base44.asServiceRole.entities.ViewingStop.create({
        viewing_plan_id,
        case_id,
        listing_id,
        scheduled_at: resolveDate(scheduled_at),
        duration_minutes: toNumber(duration_minutes, 60),
        status: status || 'draft',
        meeting_point,
        broker_id: assigned_to || '',
        area_label,
        notes
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_internal_touch_at: now });
    }

    if (action === 'update_viewing_stop') {
      if (!viewing_stop_id) {
        return Response.json({ error: 'viewing_stop_id is required' }, { status: 400 });
      }
      result.viewingStop = await base44.asServiceRole.entities.ViewingStop.update(viewing_stop_id, {
        scheduled_at: scheduled_at ? resolveDate(scheduled_at) : undefined,
        duration_minutes: duration_minutes ? toNumber(duration_minutes, 60) : undefined,
        status: status || undefined,
        meeting_point: meeting_point || undefined,
        broker_id: assigned_to || undefined,
        area_label: area_label || undefined,
        notes: notes || undefined
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        last_internal_touch_at: now,
        last_client_touch_at: ['confirmed', 'rescheduled', 'cancelled'].includes(status || '') ? now : caseRecord.last_client_touch_at
      });
    }

    if (action === 'add_service_referral') {
      result.referral = await base44.asServiceRole.entities.ServiceReferral.create({
        case_id,
        service_type: service_type || 'other',
        partner_id: partner_id || caseRecord.primary_partner_id || '',
        status: status || 'sent',
        referred_at: now,
        notes
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: 'partner_matching',
        last_internal_touch_at: now
      });
      await notifyPartnerUsers(base44, result.referral.partner_id, 'Service referral sent', `A ${result.referral.service_type} referral was sent for ${caseRecord.case_code}.`, {
        concierge_case_id: caseRecord.id,
        service_referral_id: result.referral.id,
        route_path: '/partner/concierge'
      });
    }

    if (action === 'update_service_referral') {
      if (!referral_id) {
        return Response.json({ error: 'referral_id is required' }, { status: 400 });
      }
      const existingReferral = await base44.asServiceRole.entities.ServiceReferral.get(referral_id);
      result.referral = await base44.asServiceRole.entities.ServiceReferral.update(existingReferral.id, {
        status: status || existingReferral.status,
        accepted_at: status === 'accepted' ? now : existingReferral.accepted_at || '',
        completed_at: status === 'completed' ? now : existingReferral.completed_at || '',
        notes: mergeText(existingReferral.notes, notes),
        outcome: description || existingReferral.outcome || ''
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: status === 'completed' ? 'active_service' : caseRecord.case_status,
        last_internal_touch_at: now
      });
    }

    if (action === 'add_participant') {
      result.participant = await base44.asServiceRole.entities.CaseParticipant.create({
        case_id,
        participant_type,
        name: name || 'Case participant',
        email,
        phone,
        organisation,
        role_in_case,
        notes
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_internal_touch_at: now });
    }

    if (action === 'add_note') {
      result.note = await base44.asServiceRole.entities.ConciergeNote.create({
        case_id,
        note_type,
        content: content || notes || summary || 'Case note added.',
        created_by: user.id,
        visibility,
        created_at: now
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_internal_touch_at: now });
    }

    if (action === 'update_preferences') {
      const existingPreferences = (await base44.asServiceRole.entities.ClientPreferenceProfile.filter({ case_id }))[0];
      const preferencePayload = {
        lifestyle_preferences_json: parseObject(lifestyle_preferences_json),
        risk_profile: risk_profile || existingPreferences?.risk_profile || '',
        investment_preferences_json: parseObject(investment_preferences_json),
        family_requirements_json: parseObject(family_requirements_json),
        must_have_features_json: parseObject(must_have_features_json),
        deal_breakers_json: parseObject(deal_breakers_json),
        travel_preferences_json: parseObject(travel_preferences_json),
        service_needs_json: parseObject(service_needs_json),
        privacy_expectations_json: parseObject(privacy_expectations_json)
      };
      result.preferences = existingPreferences
        ? await base44.asServiceRole.entities.ClientPreferenceProfile.update(existingPreferences.id, preferencePayload)
        : await base44.asServiceRole.entities.ClientPreferenceProfile.create({
            case_id,
            ...preferencePayload
          });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_internal_touch_at: now });
    }

    if (action === 'close_case') {
      const nextStatus = case_status || status || 'closed_won';
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: nextStatus,
        closed_at: now,
        last_internal_touch_at: now
      });
    }

    if (action === 'escalate_case') {
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        priority: priority || (caseRecord.priority === 'vip' ? 'vip' : 'urgent'),
        case_visibility: caseRecord.case_visibility === 'hnw_restricted' ? 'hnw_restricted' : 'restricted_private',
        last_internal_touch_at: now
      });
      result.note = await base44.asServiceRole.entities.ConciergeNote.create({
        case_id,
        note_type: 'escalation',
        content: content || notes || 'Case escalated for restricted handling.',
        created_by: user.id,
        visibility: 'concierge_only',
        created_at: now
      });
    }

    const refreshedCase = result.case || caseRecord;
    const eventSummaryMap = {
      assign_concierge: `Concierge assignment updated for ${refreshedCase.case_code}.`,
      change_priority: `Priority updated to ${refreshedCase.priority}.`,
      update_status: `Case status moved to ${refreshedCase.case_status}.`,
      add_milestone: `Milestone added: ${result.milestone?.title || title}.`,
      complete_milestone: `Milestone completed: ${result.milestone?.title || milestone_id}.`,
      add_task: `Task added: ${result.task?.title || title}.`,
      update_task: `Task updated: ${result.task?.title || task_id}.`,
      complete_task: `Task completed: ${result.task?.title || task_id}.`,
      upload_document: `Secure document uploaded: ${result.document?.title || title}.`,
      send_nda: 'NDA sent to the client.',
      mark_nda_received: 'Signed NDA received.',
      request_private_inventory: 'Private inventory request opened.',
      resolve_private_inventory: `Private inventory request moved to ${result.inventoryRequest?.request_status || status}.`,
      create_viewing_plan: `Viewing plan created: ${result.viewingPlan?.title || title}.`,
      add_viewing_stop: 'Viewing stop added to the itinerary.',
      update_viewing_stop: `Viewing stop updated to ${result.viewingStop?.status || status}.`,
      add_service_referral: `Service referral sent for ${result.referral?.service_type || service_type}.`,
      update_service_referral: `Service referral moved to ${result.referral?.status || status}.`,
      add_participant: `Case participant added: ${result.participant?.name || name}.`,
      add_note: 'Private case note added.',
      update_preferences: 'Client preference profile updated.',
      close_case: `Case closed as ${refreshedCase.case_status}.`,
      escalate_case: 'Case escalated for restricted handling.'
    };

    await createJourneyEvent(base44, case_id, action, eventSummaryMap[action] || `${action} applied to concierge case.`, user.id, {
      milestone_id: result.milestone?.id || milestone_id,
      task_id: result.task?.id || task_id,
      nda_id: result.nda?.id || nda_id,
      private_inventory_request_id: result.inventoryRequest?.id || private_inventory_request_id,
      referral_id: result.referral?.id || referral_id,
      viewing_plan_id: result.viewingPlan?.id || viewing_plan_id,
      viewing_stop_id: result.viewingStop?.id || viewing_stop_id,
      document_id: result.document?.id || '',
      participant_id: result.participant?.id || '',
      note_id: result.note?.id || ''
    });

    await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'ConciergeCase',
      entity_id: case_id,
      action,
      actor_id: user.id,
      actor_user_id: user.id,
      summary: eventSummaryMap[action] || `${action} applied to concierge case.`,
      immutable: true,
      scope: 'concierge',
      metadata: {
        case_status: refreshedCase.case_status,
        priority: refreshedCase.priority,
        milestone_id: result.milestone?.id || milestone_id,
        task_id: result.task?.id || task_id,
        nda_id: result.nda?.id || nda_id,
        private_inventory_request_id: result.inventoryRequest?.id || private_inventory_request_id,
        referral_id: result.referral?.id || referral_id,
        viewing_plan_id: result.viewingPlan?.id || viewing_plan_id,
        viewing_stop_id: result.viewingStop?.id || viewing_stop_id,
        document_id: result.document?.id || '',
        note_id: result.note?.id || '',
        notes
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
