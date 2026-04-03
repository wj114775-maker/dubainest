import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function hasPermission(user, assignments, requiredPermissions = []) {
  if (user?.role === 'admin') return true;
  const granted = new Set(assignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]));
  return requiredPermissions.some((permission) => granted.has(permission));
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function roundAmount(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function mergeNotes(existingNotes = '', newNotes = '') {
  return [existingNotes, newNotes].filter(Boolean).join(' | ');
}

function generateCode(prefix) {
  return `${prefix}-${Date.now()}`;
}

function deriveEntitlementStatus(entitlement, invoice, payout) {
  if (!entitlement) return 'draft';
  if (entitlement.entitlement_status === 'reversed') return 'reversed';
  if (entitlement.entitlement_status === 'written_off') return 'written_off';
  if (payout?.payout_status === 'paid') return 'paid';
  if (payout?.payout_status === 'partially_paid') return 'partially_paid';
  if (invoice?.invoice_status) return 'awaiting_payment';
  return entitlement.entitlement_status === 'adjusted' ? 'adjusted' : 'approved';
}

async function notifyPartnerUsers(base44, partnerId, title, body, metadata = {}) {
  const profiles = await base44.asServiceRole.entities.PartnerUserProfile.filter({ partner_agency_id: partnerId });
  if (!profiles.length) {
    await base44.asServiceRole.entities.Notification.create({ title, body, category: 'revenue', ...metadata, channel: 'in_app', status: 'queued' });
    return;
  }

  await Promise.all(profiles.map((profile) => base44.asServiceRole.entities.Notification.create({
    user_id: profile.user_id,
    title,
    body,
    category: 'revenue',
    ...metadata,
    channel: 'in_app',
    status: 'queued'
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

    const {
      action = '',
      entitlement_id = '',
      invoice_id = '',
      payout_id = '',
      dispute_id = '',
      settlement_id = '',
      notes = '',
      amount = 0,
      amount_delta = 0,
      due_date = '',
      received_date = '',
      payment_method = '',
      transaction_reference = '',
      dispute_type = '',
      summary = '',
      severity = 'medium',
      settlement_type = 'commercial_settlement',
      evidence_type = 'commercial_note',
      file_url = '',
      agreed_amount = 0,
      agreed_at = ''
    } = await req.json();

    if (!action) {
      return Response.json({ error: 'action is required' }, { status: 400 });
    }

    const actionPermissionMap = {
      approve_entitlement: ['revenue.approve'],
      reject_entitlement: ['revenue.approve'],
      create_invoice: ['invoice.create'],
      mark_partial_payment: ['payment.manage'],
      mark_paid: ['payment.manage'],
      open_dispute: ['revenue.dispute.manage'],
      resolve_dispute: ['revenue.dispute.manage'],
      create_adjustment: ['revenue.adjust'],
      create_clawback: ['revenue.adjust'],
      reverse: ['revenue.reverse'],
      write_off: ['revenue.writeoff'],
      create_settlement: ['settlement.manage'],
      agree_settlement: ['settlement.manage'],
      mark_settlement_paid: ['settlement.manage'],
      upload_evidence: ['revenue.read', 'payment.manage']
    };

    if (!hasPermission(user, activeAssignments, actionPermissionMap[action] || ['revenue.approve'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let entitlement = entitlement_id ? await base44.asServiceRole.entities.RevenueEntitlement.get(entitlement_id) : null;
    let invoice = invoice_id ? await base44.asServiceRole.entities.InvoiceRecord.get(invoice_id) : null;
    let payout = payout_id ? await base44.asServiceRole.entities.PayoutRecord.get(payout_id) : null;
    let dispute = dispute_id ? await base44.asServiceRole.entities.RevenueDispute.get(dispute_id) : null;
    let settlement = settlement_id ? await base44.asServiceRole.entities.SettlementRecord.get(settlement_id) : null;

    if (!entitlement && invoice?.entitlement_id) entitlement = await base44.asServiceRole.entities.RevenueEntitlement.get(invoice.entitlement_id);
    if (!entitlement && payout?.entitlement_id) entitlement = await base44.asServiceRole.entities.RevenueEntitlement.get(payout.entitlement_id);
    if (!entitlement && dispute?.entitlement_id) entitlement = await base44.asServiceRole.entities.RevenueEntitlement.get(dispute.entitlement_id);
    if (!entitlement && settlement?.entitlement_id) entitlement = await base44.asServiceRole.entities.RevenueEntitlement.get(settlement.entitlement_id);

    if (['approve_entitlement', 'reject_entitlement', 'create_invoice', 'mark_partial_payment', 'mark_paid', 'open_dispute', 'create_adjustment', 'reverse', 'write_off', 'create_settlement', 'upload_evidence'].includes(action) && !entitlement) {
      return Response.json({ error: 'Revenue entitlement not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const result = { entitlement, invoice, payout, dispute, settlement, ledger: null, adjustment: null, evidence: null };

    if (action === 'approve_entitlement') {
      result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
        entitlement_status: 'approved',
        approved_by: user.id,
        approved_at: now,
        notes: mergeNotes(entitlement.notes, notes)
      });

      const accrualEntries = await base44.asServiceRole.entities.RevenueLedger.filter({ entitlement_id: entitlement.id });
      await Promise.all(accrualEntries.filter((entry) => entry.entry_type === 'accrual').map((entry) => base44.asServiceRole.entities.RevenueLedger.update(entry.id, { status: 'posted' })));
      await base44.asServiceRole.entities.Notification.create({
        title: 'Revenue entitlement approved',
        body: `${entitlement.id} is ready for invoicing.`,
        entitlement_id: entitlement.id,
        category: 'revenue',
        route_path: `/ops/revenue/${entitlement.id}`,
        channel: 'in_app',
        status: 'queued'
      });
    }

    if (action === 'reject_entitlement') {
      result.ledger = await base44.asServiceRole.entities.RevenueLedger.create({
        lead_id: entitlement.lead_id,
        partner_id: entitlement.partner_id,
        entitlement_id: entitlement.id,
        entry_type: 'reversal',
        amount: roundAmount(entitlement.net_amount || entitlement.gross_amount || 0),
        currency: entitlement.currency || 'AED',
        status: 'posted',
        entry_date: now,
        reference_code: generateCode('REV-REJ'),
        summary: `Entitlement rejected${notes ? `: ${notes}` : ''}`,
        balance_effect: 'debit',
        metadata_json: { rejected_by: user.id }
      });
      result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
        entitlement_status: 'rejected',
        notes: mergeNotes(entitlement.notes, notes)
      });
    }

    if (action === 'create_invoice') {
      const issueDate = now;
      const nextDueDate = due_date ? new Date(due_date).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      result.invoice = await base44.asServiceRole.entities.InvoiceRecord.create({
        partner_id: entitlement.partner_id,
        entitlement_id: entitlement.id,
        invoice_number: generateCode('INV'),
        invoice_status: 'issued',
        issue_date: issueDate,
        due_date: nextDueDate,
        currency: entitlement.currency || 'AED',
        gross_amount: roundAmount(entitlement.gross_amount || 0),
        tax_amount: roundAmount(entitlement.tax_amount || 0),
        net_amount: roundAmount(entitlement.net_amount || entitlement.gross_amount || 0),
        notes
      });
      result.payout = await base44.asServiceRole.entities.PayoutRecord.create({
        partner_id: entitlement.partner_id,
        invoice_id: result.invoice.id,
        entitlement_id: entitlement.id,
        payout_status: 'expected',
        expected_amount: roundAmount(entitlement.net_amount || entitlement.gross_amount || 0),
        paid_amount: roundAmount(entitlement.paid_amount || 0),
        currency: entitlement.currency || 'AED',
        expected_date: nextDueDate,
        notes
      });
      result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
        entitlement_status: 'invoiced',
        invoice_id: result.invoice.id,
        payout_id: result.payout.id,
        due_date: nextDueDate,
        notes: mergeNotes(entitlement.notes, notes)
      });
      await notifyPartnerUsers(base44, entitlement.partner_id, 'Invoice issued', `Invoice ${result.invoice.invoice_number} has been issued for your revenue entitlement.`, {
        entitlement_id: entitlement.id,
        invoice_id: result.invoice.id,
        route_path: '/partner/payouts'
      });
    }

    if (action === 'mark_partial_payment' || action === 'mark_paid') {
      const paymentAmount = roundAmount(action === 'mark_paid'
        ? (toNumber(amount) || Math.max(0, toNumber(entitlement.net_amount || entitlement.gross_amount || 0) - toNumber(entitlement.paid_amount || 0)))
        : toNumber(amount));

      if (paymentAmount <= 0) {
        return Response.json({ error: 'amount must be greater than zero' }, { status: 400 });
      }

      if (!invoice && entitlement.invoice_id) invoice = await base44.asServiceRole.entities.InvoiceRecord.get(entitlement.invoice_id);
      if (!payout && entitlement.payout_id) payout = await base44.asServiceRole.entities.PayoutRecord.get(entitlement.payout_id);
      if (!payout) {
        payout = await base44.asServiceRole.entities.PayoutRecord.create({
          partner_id: entitlement.partner_id,
          invoice_id: invoice?.id || '',
          entitlement_id: entitlement.id,
          payout_status: 'expected',
          expected_amount: roundAmount(entitlement.net_amount || entitlement.gross_amount || 0),
          paid_amount: 0,
          currency: entitlement.currency || 'AED',
          expected_date: entitlement.due_date || now,
          notes: 'Auto-created during payment update'
        });
      }

      const totalPaid = roundAmount(toNumber(payout.paid_amount || 0) + paymentAmount);
      const expectedAmount = roundAmount(toNumber(payout.expected_amount || entitlement.net_amount || entitlement.gross_amount || 0));
      const paidInFull = totalPaid >= expectedAmount;
      result.payout = await base44.asServiceRole.entities.PayoutRecord.update(payout.id, {
        payout_status: paidInFull ? 'paid' : 'partially_paid',
        paid_amount: totalPaid,
        received_date: received_date ? new Date(received_date).toISOString() : now,
        payment_method: payment_method || payout.payment_method || '',
        transaction_reference: transaction_reference || payout.transaction_reference || '',
        notes: mergeNotes(payout.notes, notes)
      });

      if (invoice) {
        result.invoice = await base44.asServiceRole.entities.InvoiceRecord.update(invoice.id, {
          invoice_status: paidInFull ? 'paid' : 'partially_paid',
          notes: mergeNotes(invoice.notes, notes)
        });
      }

      result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
        entitlement_status: paidInFull ? 'paid' : 'partially_paid',
        paid_amount: totalPaid,
        payout_id: result.payout.id,
        notes: mergeNotes(entitlement.notes, notes)
      });

      result.ledger = await base44.asServiceRole.entities.RevenueLedger.create({
        lead_id: entitlement.lead_id,
        partner_id: entitlement.partner_id,
        entitlement_id: entitlement.id,
        invoice_id: result.invoice?.id || invoice?.id || '',
        payout_id: result.payout.id,
        entry_type: 'settlement',
        amount: paymentAmount,
        currency: entitlement.currency || 'AED',
        status: 'posted',
        entry_date: result.payout.received_date || now,
        reference_code: generateCode('PAY'),
        summary: paidInFull ? 'Payment marked paid' : 'Partial payment recorded',
        balance_effect: 'credit',
        metadata_json: { transaction_reference: transaction_reference || '' }
      });

      await notifyPartnerUsers(base44, entitlement.partner_id, paidInFull ? 'Invoice marked paid' : 'Partial payment recorded', `Commercial payment status was updated for ${entitlement.id}.`, {
        entitlement_id: entitlement.id,
        invoice_id: result.invoice?.id || invoice?.id || '',
        route_path: '/partner/payouts'
      });
    }

    if (action === 'open_dispute') {
      result.dispute = await base44.asServiceRole.entities.RevenueDispute.create({
        partner_id: entitlement.partner_id,
        lead_id: entitlement.lead_id,
        entitlement_id: entitlement.id,
        invoice_id: invoice?.id || entitlement.invoice_id || '',
        dispute_type,
        summary: summary || `Revenue dispute opened for ${entitlement.id}`,
        status: 'open',
        severity,
        opened_by: user.id,
        assigned_reviewer_id: user.id,
        opened_at: now,
        notes
      });

      result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
        entitlement_status: 'disputed',
        notes: mergeNotes(entitlement.notes, notes)
      });

      if (invoice || entitlement.invoice_id) {
        const targetInvoice = invoice || await base44.asServiceRole.entities.InvoiceRecord.get(entitlement.invoice_id);
        result.invoice = await base44.asServiceRole.entities.InvoiceRecord.update(targetInvoice.id, {
          invoice_status: 'disputed',
          notes: mergeNotes(targetInvoice.notes, notes)
        });
      }

      if (payout || entitlement.payout_id) {
        const targetPayout = payout || await base44.asServiceRole.entities.PayoutRecord.get(entitlement.payout_id);
        result.payout = await base44.asServiceRole.entities.PayoutRecord.update(targetPayout.id, {
          payout_status: 'disputed',
          notes: mergeNotes(targetPayout.notes, notes)
        });
      }

      await notifyPartnerUsers(base44, entitlement.partner_id, 'Revenue dispute opened', `A dispute was opened for entitlement ${entitlement.id}.`, {
        entitlement_id: entitlement.id,
        dispute_id: result.dispute.id,
        route_path: '/partner/disputes'
      });
    }

    if (action === 'resolve_dispute') {
      if (!dispute) {
        return Response.json({ error: 'dispute_id is required' }, { status: 400 });
      }

      result.dispute = await base44.asServiceRole.entities.RevenueDispute.update(dispute.id, {
        status: 'resolved',
        resolution_notes: notes || dispute.resolution_notes || 'Resolved by internal finance.',
        resolved_at: now,
        resolved_by: user.id
      });

      if (!invoice && dispute.invoice_id) invoice = await base44.asServiceRole.entities.InvoiceRecord.get(dispute.invoice_id);
      if (!payout && entitlement?.payout_id) payout = await base44.asServiceRole.entities.PayoutRecord.get(entitlement.payout_id);
      const nextEntitlementStatus = deriveEntitlementStatus(entitlement, invoice, payout);
      result.entitlement = entitlement
        ? await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
            entitlement_status: nextEntitlementStatus,
            notes: mergeNotes(entitlement.notes, notes)
          })
        : null;

      if (invoice) {
        result.invoice = await base44.asServiceRole.entities.InvoiceRecord.update(invoice.id, {
          invoice_status: payout?.payout_status === 'paid' ? 'paid' : payout?.payout_status === 'partially_paid' ? 'partially_paid' : 'issued',
          notes: mergeNotes(invoice.notes, notes)
        });
      }

      await notifyPartnerUsers(base44, dispute.partner_id, 'Revenue dispute resolved', `Dispute ${dispute.id} has been resolved.`, {
        entitlement_id: result.entitlement?.id || entitlement?.id || '',
        dispute_id: dispute.id,
        route_path: '/partner/disputes'
      });
    }

    if (action === 'create_adjustment') {
      const delta = roundAmount(amount_delta);
      if (!delta) {
        return Response.json({ error: 'amount_delta is required' }, { status: 400 });
      }

      result.adjustment = await base44.asServiceRole.entities.RevenueAdjustment.create({
        entitlement_id: entitlement.id,
        adjustment_type: 'manual_adjustment',
        amount_delta: delta,
        reason: notes || 'Manual adjustment',
        approved_by: user.id,
        approved_at: now,
        notes
      });

      const nextGrossAmount = roundAmount(toNumber(entitlement.gross_amount || 0) + delta);
      const nextNetAmount = roundAmount(toNumber(entitlement.net_amount || entitlement.gross_amount || 0) + delta);
      result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
        gross_amount: nextGrossAmount,
        net_amount: nextNetAmount,
        entitlement_status: 'adjusted',
        notes: mergeNotes(entitlement.notes, notes)
      });

      if (invoice || entitlement.invoice_id) {
        const targetInvoice = invoice || await base44.asServiceRole.entities.InvoiceRecord.get(entitlement.invoice_id);
        result.invoice = await base44.asServiceRole.entities.InvoiceRecord.update(targetInvoice.id, {
          gross_amount: roundAmount(toNumber(targetInvoice.gross_amount || 0) + delta),
          net_amount: roundAmount(toNumber(targetInvoice.net_amount || targetInvoice.gross_amount || 0) + delta),
          notes: mergeNotes(targetInvoice.notes, notes)
        });
      }

      if (payout || entitlement.payout_id) {
        const targetPayout = payout || await base44.asServiceRole.entities.PayoutRecord.get(entitlement.payout_id);
        result.payout = await base44.asServiceRole.entities.PayoutRecord.update(targetPayout.id, {
          expected_amount: roundAmount(toNumber(targetPayout.expected_amount || 0) + delta),
          notes: mergeNotes(targetPayout.notes, notes)
        });
      }

      result.ledger = await base44.asServiceRole.entities.RevenueLedger.create({
        lead_id: entitlement.lead_id,
        partner_id: entitlement.partner_id,
        entitlement_id: entitlement.id,
        invoice_id: result.invoice?.id || invoice?.id || '',
        payout_id: result.payout?.id || payout?.id || '',
        adjustment_id: result.adjustment.id,
        entry_type: 'adjustment',
        amount: Math.abs(delta),
        currency: entitlement.currency || 'AED',
        status: 'posted',
        entry_date: now,
        reference_code: generateCode('ADJ'),
        summary: `Adjustment applied${notes ? `: ${notes}` : ''}`,
        balance_effect: delta >= 0 ? 'credit' : 'debit',
        metadata_json: { amount_delta: delta }
      });
    }

    if (action === 'create_clawback') {
      const clawbackAmount = Math.abs(roundAmount(amount_delta));
      if (!clawbackAmount) {
        return Response.json({ error: 'amount_delta is required' }, { status: 400 });
      }

      result.adjustment = await base44.asServiceRole.entities.RevenueAdjustment.create({
        entitlement_id: entitlement.id,
        adjustment_type: 'clawback',
        amount_delta: -clawbackAmount,
        reason: notes || 'Commercial clawback',
        approved_by: user.id,
        approved_at: now,
        notes
      });

      const nextGrossAmount = Math.max(0, roundAmount(toNumber(entitlement.gross_amount || 0) - clawbackAmount));
      const nextNetAmount = Math.max(0, roundAmount(toNumber(entitlement.net_amount || entitlement.gross_amount || 0) - clawbackAmount));
      result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
        gross_amount: nextGrossAmount,
        net_amount: nextNetAmount,
        entitlement_status: 'adjusted',
        notes: mergeNotes(entitlement.notes, notes)
      });

      if (invoice || entitlement.invoice_id) {
        const targetInvoice = invoice || await base44.asServiceRole.entities.InvoiceRecord.get(entitlement.invoice_id);
        result.invoice = await base44.asServiceRole.entities.InvoiceRecord.update(targetInvoice.id, {
          gross_amount: Math.max(0, roundAmount(toNumber(targetInvoice.gross_amount || 0) - clawbackAmount)),
          net_amount: Math.max(0, roundAmount(toNumber(targetInvoice.net_amount || targetInvoice.gross_amount || 0) - clawbackAmount)),
          notes: mergeNotes(targetInvoice.notes, notes)
        });
      }

      if (payout || entitlement.payout_id) {
        const targetPayout = payout || await base44.asServiceRole.entities.PayoutRecord.get(entitlement.payout_id);
        result.payout = await base44.asServiceRole.entities.PayoutRecord.update(targetPayout.id, {
          expected_amount: Math.max(0, roundAmount(toNumber(targetPayout.expected_amount || 0) - clawbackAmount)),
          notes: mergeNotes(targetPayout.notes, notes)
        });
      }

      result.ledger = await base44.asServiceRole.entities.RevenueLedger.create({
        lead_id: entitlement.lead_id,
        partner_id: entitlement.partner_id,
        entitlement_id: entitlement.id,
        invoice_id: result.invoice?.id || invoice?.id || '',
        payout_id: result.payout?.id || payout?.id || '',
        adjustment_id: result.adjustment.id,
        entry_type: 'clawback',
        amount: clawbackAmount,
        currency: entitlement.currency || 'AED',
        status: 'posted',
        entry_date: now,
        reference_code: generateCode('CLB'),
        summary: `Clawback applied${notes ? `: ${notes}` : ''}`,
        balance_effect: 'debit',
        metadata_json: { amount_delta: -clawbackAmount }
      });
    }

    if (action === 'reverse' || action === 'write_off') {
      const openBalance = roundAmount(Math.max(0, toNumber(entitlement.net_amount || entitlement.gross_amount || 0) - toNumber(entitlement.paid_amount || 0)));
      const adjustmentType = action === 'reverse' ? 'reversal' : 'writeoff';
      result.adjustment = await base44.asServiceRole.entities.RevenueAdjustment.create({
        entitlement_id: entitlement.id,
        adjustment_type: adjustmentType,
        amount_delta: openBalance ? -openBalance : 0,
        reason: notes || (action === 'reverse' ? 'Revenue reversed' : 'Revenue written off'),
        approved_by: user.id,
        approved_at: now,
        notes
      });

      result.ledger = await base44.asServiceRole.entities.RevenueLedger.create({
        lead_id: entitlement.lead_id,
        partner_id: entitlement.partner_id,
        entitlement_id: entitlement.id,
        invoice_id: invoice?.id || entitlement.invoice_id || '',
        payout_id: payout?.id || entitlement.payout_id || '',
        adjustment_id: result.adjustment.id,
        entry_type: action === 'reverse' ? 'reversal' : 'manual_debit',
        amount: openBalance,
        currency: entitlement.currency || 'AED',
        status: 'posted',
        entry_date: now,
        reference_code: generateCode(action === 'reverse' ? 'REV-R' : 'REV-W'),
        summary: action === 'reverse' ? 'Revenue entitlement reversed' : 'Revenue entitlement written off',
        balance_effect: 'debit',
        metadata_json: { notes }
      });

      result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
        entitlement_status: action === 'reverse' ? 'reversed' : 'written_off',
        notes: mergeNotes(entitlement.notes, notes)
      });

      if (invoice || entitlement.invoice_id) {
        const targetInvoice = invoice || await base44.asServiceRole.entities.InvoiceRecord.get(entitlement.invoice_id);
        result.invoice = await base44.asServiceRole.entities.InvoiceRecord.update(targetInvoice.id, {
          invoice_status: 'void',
          notes: mergeNotes(targetInvoice.notes, notes)
        });
      }

      if (payout || entitlement.payout_id) {
        const targetPayout = payout || await base44.asServiceRole.entities.PayoutRecord.get(entitlement.payout_id);
        result.payout = await base44.asServiceRole.entities.PayoutRecord.update(targetPayout.id, {
          payout_status: action === 'reverse' ? 'reversed' : 'withheld',
          notes: mergeNotes(targetPayout.notes, notes)
        });
      }
    }

    if (action === 'create_settlement') {
      result.settlement = await base44.asServiceRole.entities.SettlementRecord.create({
        partner_id: entitlement.partner_id,
        lead_id: entitlement.lead_id,
        entitlement_id: entitlement.id,
        settlement_type,
        settlement_status: 'pending_signoff',
        agreed_amount: roundAmount(agreed_amount || entitlement.net_amount || entitlement.gross_amount || 0),
        currency: entitlement.currency || 'AED',
        agreed_at: agreed_at ? new Date(agreed_at).toISOString() : now,
        notes
      });

      result.ledger = await base44.asServiceRole.entities.RevenueLedger.create({
        lead_id: entitlement.lead_id,
        partner_id: entitlement.partner_id,
        entitlement_id: entitlement.id,
        settlement_id: result.settlement.id,
        entry_type: 'settlement',
        amount: roundAmount(result.settlement.agreed_amount || 0),
        currency: entitlement.currency || 'AED',
        status: 'pending',
        entry_date: now,
        reference_code: generateCode('SET'),
        summary: `Settlement proposed${notes ? `: ${notes}` : ''}`,
        balance_effect: 'neutral',
        metadata_json: { settlement_type }
      });

      await notifyPartnerUsers(base44, entitlement.partner_id, 'Settlement proposal created', `A settlement proposal was opened for entitlement ${entitlement.id}.`, {
        entitlement_id: entitlement.id,
        settlement_id: result.settlement.id,
        route_path: '/partner/payouts'
      });
    }

    if (action === 'agree_settlement') {
      if (!settlement) {
        return Response.json({ error: 'settlement_id is required' }, { status: 400 });
      }

      result.settlement = await base44.asServiceRole.entities.SettlementRecord.update(settlement.id, {
        settlement_status: 'agreed',
        agreed_at: agreed_at ? new Date(agreed_at).toISOString() : now,
        notes: mergeNotes(settlement.notes, notes)
      });
    }

    if (action === 'mark_settlement_paid') {
      if (!settlement) {
        return Response.json({ error: 'settlement_id is required' }, { status: 400 });
      }

      const settlementAmount = roundAmount(settlement.agreed_amount || 0);
      result.settlement = await base44.asServiceRole.entities.SettlementRecord.update(settlement.id, {
        settlement_status: 'paid',
        paid_at: received_date ? new Date(received_date).toISOString() : now,
        notes: mergeNotes(settlement.notes, notes)
      });

      result.ledger = await base44.asServiceRole.entities.RevenueLedger.create({
        lead_id: entitlement?.lead_id || settlement.lead_id,
        partner_id: settlement.partner_id,
        entitlement_id: settlement.entitlement_id,
        settlement_id: settlement.id,
        entry_type: 'settlement',
        amount: settlementAmount,
        currency: settlement.currency || 'AED',
        status: 'posted',
        entry_date: result.settlement.paid_at || now,
        reference_code: generateCode('SET-P'),
        summary: 'Settlement paid',
        balance_effect: 'credit',
        metadata_json: { transaction_reference }
      });

      if (entitlement) {
        const totalPaid = roundAmount(toNumber(entitlement.paid_amount || 0) + settlementAmount);
        result.entitlement = await base44.asServiceRole.entities.RevenueEntitlement.update(entitlement.id, {
          paid_amount: totalPaid,
          entitlement_status: totalPaid >= toNumber(entitlement.net_amount || entitlement.gross_amount || 0) ? 'paid' : 'partially_paid',
          notes: mergeNotes(entitlement.notes, notes)
        });
      }
    }

    if (action === 'upload_evidence') {
      result.evidence = await base44.asServiceRole.entities.RevenueEvidence.create({
        entitlement_id: entitlement?.id || settlement?.entitlement_id || '',
        dispute_id: dispute?.id || '',
        invoice_id: invoice?.id || entitlement?.invoice_id || '',
        evidence_type,
        file_url,
        summary: summary || notes || 'Revenue evidence uploaded',
        uploaded_by: user.id,
        uploaded_at: now
      });
    }

    const auditTargetId = result.entitlement?.id || result.dispute?.id || result.settlement?.id || result.invoice?.id || result.payout?.id || entitlement?.id || dispute?.id || settlement?.id || invoice?.id || payout?.id || '';
    const audit = await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'RevenueEntitlement',
      entity_id: auditTargetId,
      action: action,
      actor_id: user.id,
      actor_user_id: user.id,
      summary: `${action} applied to revenue workflow`,
      immutable: true,
      scope: 'finance',
      metadata: {
        entitlement_id: result.entitlement?.id || entitlement?.id || '',
        invoice_id: result.invoice?.id || invoice?.id || '',
        payout_id: result.payout?.id || payout?.id || '',
        dispute_id: result.dispute?.id || dispute?.id || '',
        settlement_id: result.settlement?.id || settlement?.id || '',
        notes,
        amount,
        amount_delta
      }
    });

    return Response.json({ ...result, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
