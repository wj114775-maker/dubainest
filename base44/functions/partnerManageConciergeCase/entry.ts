import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function hasPermission(user, assignments, requiredPermissions = []) {
  if (user?.role === 'admin') return true;
  const granted = new Set(assignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]));
  return requiredPermissions.some((permission) => granted.has(permission));
}

function mergeText(...values) {
  return values.filter(Boolean).join(' | ');
}

function resolveDate(value, fallback = '') {
  if (!value) return fallback;
  return new Date(value).toISOString();
}

async function createNotification(base44, title, body, metadata = {}) {
  return base44.asServiceRole.entities.Notification.create({
    title,
    body,
    category: 'concierge',
    channel: 'in_app',
    status: 'queued',
    ...metadata
  });
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
      viewing_stop_id = '',
      referral_id = '',
      title = '',
      content = '',
      notes = '',
      status = '',
      file_url = '',
      document_type = 'partner_document',
      visibility = 'partner_visible',
      scheduled_at = '',
      meeting_point = ''
    } = payload;

    if (!action || !case_id) {
      return Response.json({ error: 'action and case_id are required' }, { status: 400 });
    }

    const actionPermissionMap = {
      add_partner_note: ['partner_case.update_limited'],
      upload_document: ['partner_documents.upload_limited'],
      update_viewing_stop: ['partner_viewings.manage_limited'],
      accept_service_referral: ['partner_case.update_limited'],
      complete_service_referral: ['partner_case.update_limited']
    };

    if (!hasPermission(user, activeAssignments, actionPermissionMap[action] || ['partner_case.read'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profiles = await base44.entities.PartnerUserProfile.filter({ user_id: user.id });
    const partnerAgencyId = profiles[0]?.partner_agency_id;
    if (!partnerAgencyId) {
      return Response.json({ error: 'Partner agency not found' }, { status: 403 });
    }

    const caseRecord = await base44.asServiceRole.entities.ConciergeCase.get(case_id);
    if (!caseRecord || (caseRecord.primary_partner_id && caseRecord.primary_partner_id !== partnerAgencyId)) {
      return Response.json({ error: 'This case is not available for the current partner' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const result = {
      case: caseRecord,
      note: null,
      document: null,
      viewingStop: null,
      referral: null
    };

    if (action === 'add_partner_note') {
      result.note = await base44.asServiceRole.entities.ConciergeNote.create({
        case_id,
        note_type: 'partner_note',
        content: content || notes || title || 'Partner update received.',
        created_by: user.id,
        visibility: 'partner_visible',
        created_at: now
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        last_client_touch_at: now,
        case_status: caseRecord.case_status === 'waiting_on_partner' ? 'active_service' : caseRecord.case_status
      });
    }

    if (action === 'upload_document') {
      result.document = await base44.asServiceRole.entities.SecureDocument.create({
        case_id,
        document_type,
        title: title || document_type,
        file_url,
        visibility,
        uploaded_by: user.id,
        uploaded_at: now,
        security_level: 'confidential',
        notes
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, { last_client_touch_at: now });
    }

    if (action === 'update_viewing_stop') {
      if (!viewing_stop_id) {
        return Response.json({ error: 'viewing_stop_id is required' }, { status: 400 });
      }
      const stop = await base44.asServiceRole.entities.ViewingStop.get(viewing_stop_id);
      if (!stop || stop.case_id !== case_id) {
        return Response.json({ error: 'Viewing stop not found' }, { status: 404 });
      }
      result.viewingStop = await base44.asServiceRole.entities.ViewingStop.update(stop.id, {
        status: status || stop.status,
        scheduled_at: scheduled_at ? resolveDate(scheduled_at) : stop.scheduled_at,
        meeting_point: meeting_point || stop.meeting_point || '',
        notes: mergeText(stop.notes, notes)
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        last_client_touch_at: now,
        case_status: ['rescheduled', 'cancelled'].includes(status) ? 'waiting_on_partner' : caseRecord.case_status
      });
    }

    if (action === 'accept_service_referral' || action === 'complete_service_referral') {
      if (!referral_id) {
        return Response.json({ error: 'referral_id is required' }, { status: 400 });
      }
      const referral = await base44.asServiceRole.entities.ServiceReferral.get(referral_id);
      if (!referral || referral.case_id !== case_id || referral.partner_id !== partnerAgencyId) {
        return Response.json({ error: 'Service referral not found' }, { status: 404 });
      }
      const nextStatus = action === 'accept_service_referral' ? 'accepted' : 'completed';
      result.referral = await base44.asServiceRole.entities.ServiceReferral.update(referral.id, {
        status: nextStatus,
        accepted_at: nextStatus === 'accepted' ? now : referral.accepted_at || '',
        completed_at: nextStatus === 'completed' ? now : referral.completed_at || '',
        notes: mergeText(referral.notes, notes)
      });
      result.case = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
        case_status: nextStatus === 'completed' ? 'active_service' : 'waiting_on_partner',
        last_client_touch_at: now
      });
    }

    const summaryMap = {
      add_partner_note: 'Partner note added to concierge case.',
      upload_document: 'Partner document uploaded to concierge case.',
      update_viewing_stop: `Viewing coordination updated to ${result.viewingStop?.status || status}.`,
      accept_service_referral: 'Partner accepted a service referral.',
      complete_service_referral: 'Partner completed a service referral.'
    };

    await base44.asServiceRole.entities.ClientJourneyEvent.create({
      case_id,
      event_type: action,
      summary: summaryMap[action] || `${action} completed by partner.`,
      actor_type: 'partner',
      actor_id: user.id,
      created_at: now,
      payload_json: {
        partner_id: partnerAgencyId,
        viewing_stop_id: result.viewingStop?.id || viewing_stop_id,
        referral_id: result.referral?.id || referral_id,
        document_id: result.document?.id || '',
        note_id: result.note?.id || ''
      }
    });

    await createNotification(base44, 'Partner concierge update', `${caseRecord.case_code} received a partner-side update.`, {
      concierge_case_id: case_id,
      service_referral_id: result.referral?.id || '',
      route_path: `/ops/concierge/${case_id}`
    });

    await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'ConciergeCase',
      entity_id: case_id,
      action,
      actor_id: user.id,
      actor_user_id: user.id,
      summary: summaryMap[action] || `${action} completed by partner.`,
      immutable: true,
      scope: 'partner',
      metadata: {
        partner_id: partnerAgencyId,
        viewing_stop_id: result.viewingStop?.id || viewing_stop_id,
        referral_id: result.referral?.id || referral_id,
        document_id: result.document?.id || '',
        note_id: result.note?.id || ''
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
