import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function hasPermission(user, assignments, requiredPermissions = []) {
  if (user?.role === 'admin') return true;
  const granted = new Set(assignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]));
  return requiredPermissions.some((permission) => granted.has(permission));
}

function mergeNotes(existingNotes = '', newNotes = '') {
  return [existingNotes, newNotes].filter(Boolean).join(' | ');
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
      entitlement_id = '',
      invoice_id = '',
      dispute_id = '',
      dispute_type = '',
      summary = '',
      severity = 'medium',
      notes = '',
      file_url = '',
      evidence_type = 'commercial_note'
    } = payload;

    if (!action) {
      return Response.json({ error: 'action is required' }, { status: 400 });
    }

    const actionPermissionMap = {
      acknowledge_invoice: ['partner_invoice.read'],
      raise_dispute: ['partner_dispute.create'],
      upload_payment_evidence: ['partner_payment_evidence.upload'],
      add_commercial_note: ['partner_revenue.read'],
      request_clarification: ['partner_revenue.read']
    };

    if (!hasPermission(user, activeAssignments, actionPermissionMap[action] || ['partner_revenue.read'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profiles = await base44.entities.PartnerUserProfile.filter({ user_id: user.id });
    const partnerAgencyId = profiles[0]?.partner_agency_id;
    if (!partnerAgencyId) {
      return Response.json({ error: 'Partner agency not found for user' }, { status: 403 });
    }

    let entitlement = entitlement_id ? await base44.asServiceRole.entities.RevenueEntitlement.get(entitlement_id) : null;
    let invoice = invoice_id ? await base44.asServiceRole.entities.InvoiceRecord.get(invoice_id) : null;
    let dispute = dispute_id ? await base44.asServiceRole.entities.RevenueDispute.get(dispute_id) : null;

    if (!entitlement && invoice?.entitlement_id) entitlement = await base44.asServiceRole.entities.RevenueEntitlement.get(invoice.entitlement_id);
    if (!entitlement && dispute?.entitlement_id) entitlement = await base44.asServiceRole.entities.RevenueEntitlement.get(dispute.entitlement_id);

    const ownershipPartnerId = entitlement?.partner_id || invoice?.partner_id || dispute?.partner_id || '';
    if (ownershipPartnerId && ownershipPartnerId !== partnerAgencyId) {
      return Response.json({ error: 'This revenue record does not belong to the current partner' }, { status: 403 });
    }

    const now = new Date().toISOString();
    const result = { entitlement, invoice, dispute, evidence: null };

    if (action === 'acknowledge_invoice') {
      if (!invoice) {
        return Response.json({ error: 'invoice_id is required' }, { status: 400 });
      }
      result.invoice = await base44.asServiceRole.entities.InvoiceRecord.update(invoice.id, {
        invoice_status: invoice.invoice_status === 'issued' ? 'acknowledged' : invoice.invoice_status,
        acknowledged_at: now,
        notes: mergeNotes(invoice.notes, notes)
      });
      await base44.asServiceRole.entities.Notification.create({
        title: 'Invoice acknowledged',
        body: `Partner ${partnerAgencyId} acknowledged invoice ${invoice.invoice_number}.`,
        invoice_id: invoice.id,
        entitlement_id: entitlement?.id || '',
        category: 'revenue',
        route_path: `/ops/revenue/${entitlement?.id || invoice.entitlement_id || ''}`,
        channel: 'in_app',
        status: 'queued'
      });
    }

    if (action === 'raise_dispute') {
      if (!entitlement && !invoice) {
        return Response.json({ error: 'entitlement_id or invoice_id is required' }, { status: 400 });
      }

      result.dispute = await base44.asServiceRole.entities.RevenueDispute.create({
        partner_id: partnerAgencyId,
        lead_id: entitlement?.lead_id || '',
        entitlement_id: entitlement?.id || '',
        invoice_id: invoice?.id || entitlement?.invoice_id || '',
        dispute_type,
        summary: summary || 'Partner dispute opened',
        status: 'open',
        severity,
        opened_by: user.id,
        opened_at: now,
        notes
      });

      if (entitlement) {
        result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
          entitlement_status: 'disputed',
          notes: mergeNotes(entitlement.notes, notes)
        });
      }

      if (invoice) {
        result.invoice = await base44.asServiceRole.entities.InvoiceRecord.update(invoice.id, {
          invoice_status: 'disputed',
          notes: mergeNotes(invoice.notes, notes)
        });
      }

      await base44.asServiceRole.entities.Notification.create({
        title: 'Revenue dispute opened',
        body: `Partner ${partnerAgencyId} opened a dispute on ${entitlement?.id || invoice?.invoice_number || 'a revenue item'}.`,
        entitlement_id: result.entitlement?.id || entitlement?.id || '',
        invoice_id: result.invoice?.id || invoice?.id || '',
        dispute_id: result.dispute.id,
        category: 'revenue',
        route_path: `/ops/revenue/${result.entitlement?.id || entitlement?.id || invoice?.entitlement_id || ''}`,
        channel: 'in_app',
        status: 'queued'
      });
    }

    if (action === 'upload_payment_evidence' || action === 'add_commercial_note' || action === 'request_clarification') {
      if (!entitlement && !invoice && !dispute) {
        return Response.json({ error: 'A revenue record reference is required' }, { status: 400 });
      }

      result.evidence = await base44.asServiceRole.entities.RevenueEvidence.create({
        entitlement_id: entitlement?.id || dispute?.entitlement_id || '',
        dispute_id: dispute?.id || '',
        invoice_id: invoice?.id || entitlement?.invoice_id || '',
        evidence_type: action === 'upload_payment_evidence' ? 'payment_receipt' : evidence_type,
        file_url,
        summary: summary || notes || (action === 'request_clarification' ? 'Partner requested clarification' : 'Partner note added'),
        uploaded_by: user.id,
        uploaded_at: now
      });

      if (action === 'request_clarification' && dispute) {
        result.dispute = await base44.asServiceRole.entities.RevenueDispute.update(dispute.id, {
          status: 'awaiting_partner_response',
          notes: mergeNotes(dispute.notes, notes)
        });
      }

      await base44.asServiceRole.entities.Notification.create({
        title: action === 'upload_payment_evidence' ? 'Payment evidence uploaded' : 'Partner commercial note received',
        body: `Partner ${partnerAgencyId} added commercial evidence for ${entitlement?.id || invoice?.invoice_number || dispute?.id || 'a revenue item'}.`,
        entitlement_id: entitlement?.id || dispute?.entitlement_id || '',
        invoice_id: invoice?.id || entitlement?.invoice_id || '',
        dispute_id: dispute?.id || '',
        category: 'revenue',
        route_path: `/ops/revenue/${entitlement?.id || dispute?.entitlement_id || invoice?.entitlement_id || ''}`,
        channel: 'in_app',
        status: 'queued'
      });
    }

    const audit = await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'RevenueEntitlement',
      entity_id: result.entitlement?.id || result.invoice?.id || result.dispute?.id || '',
      action,
      actor_id: user.id,
      actor_user_id: user.id,
      summary: `${action} submitted by partner`,
      immutable: true,
      scope: 'partner',
      metadata: {
        partner_agency_id: partnerAgencyId,
        entitlement_id: result.entitlement?.id || entitlement?.id || '',
        invoice_id: result.invoice?.id || invoice?.id || '',
        dispute_id: result.dispute?.id || dispute?.id || '',
        evidence_id: result.evidence?.id || ''
      }
    });

    return Response.json({ ...result, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
