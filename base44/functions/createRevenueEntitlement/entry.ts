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

function buildRuleScore(rule, context) {
  const now = Date.now();
  if ((rule.status || 'draft') !== 'active') return -1;
  if (rule.trigger_type !== context.event_type && rule.trigger_type !== 'manual') return -1;
  if (rule.effective_from && new Date(rule.effective_from).getTime() > now) return -1;
  if (rule.effective_to && new Date(rule.effective_to).getTime() < now) return -1;
  if (rule.partner_id && rule.partner_id !== context.partner_id) return -1;
  if (rule.project_id && rule.project_id !== context.project_id) return -1;
  if (rule.listing_type && rule.listing_type !== context.listing_type) return -1;
  if (rule.lead_type && rule.lead_type !== context.lead_type) return -1;
  if (rule.buyer_type && rule.buyer_type !== context.buyer_type) return -1;
  if (rule.private_inventory_only && !context.is_private_inventory) return -1;
  if (rule.high_value_only && !context.is_high_value) return -1;

  let score = Number(rule.priority || 0);
  if (rule.partner_id) score += 40;
  if (rule.project_id) score += 25;
  if (rule.listing_type) score += 10;
  if (rule.lead_type) score += 10;
  if (rule.buyer_type) score += 10;
  if (rule.private_inventory_only) score += 20;
  if (rule.high_value_only) score += 20;
  if (rule.trigger_type === context.event_type) score += 30;
  return score;
}

function calculateAmount(rule, context) {
  const flatAmount = toNumber(rule.flat_amount);
  const percentageRate = toNumber(rule.percentage_rate);
  const dealValue = toNumber(context.deal_value);
  const partnerCommissionAmount = toNumber(context.partner_commission_amount);
  const manualAmount = toNumber(context.manual_amount);
  let calculated = 0;
  let basis = 'flat_amount';

  switch (rule.calculation_method) {
    case 'flat_amount':
    case 'milestone_flat':
      calculated = flatAmount;
      break;
    case 'percentage_of_partner_commission':
      calculated = partnerCommissionAmount * (percentageRate / 100);
      basis = 'partner_commission_amount';
      break;
    case 'percentage_of_sale_price':
      calculated = dealValue * (percentageRate / 100);
      basis = 'deal_value';
      break;
    case 'hybrid': {
      const baseValue = partnerCommissionAmount || dealValue;
      calculated = flatAmount + (baseValue * (percentageRate / 100));
      basis = partnerCommissionAmount ? 'partner_commission_amount_plus_flat' : 'deal_value_plus_flat';
      break;
    }
    case 'manual':
      calculated = manualAmount || flatAmount;
      basis = 'manual_amount';
      break;
    default:
      calculated = flatAmount;
  }

  const beforeBounds = calculated;
  if (rule.minimum_amount != null) calculated = Math.max(calculated, toNumber(rule.minimum_amount));
  if (rule.maximum_amount != null && toNumber(rule.maximum_amount) > 0) calculated = Math.min(calculated, toNumber(rule.maximum_amount));

  const grossAmount = roundAmount(calculated);
  const taxAmount = roundAmount(context.tax_amount || 0);
  const netAmount = roundAmount(grossAmount - taxAmount);

  return {
    grossAmount,
    taxAmount,
    netAmount,
    snapshot: {
      rule_code: rule.rule_code,
      rule_name: rule.name,
      trigger_type: rule.trigger_type,
      fee_type: rule.fee_type,
      calculation_method: rule.calculation_method,
      basis,
      percentage_rate: percentageRate,
      flat_amount: flatAmount,
      minimum_amount: rule.minimum_amount ?? null,
      maximum_amount: rule.maximum_amount ?? null,
      input_values: {
        deal_value: dealValue,
        partner_commission_amount: partnerCommissionAmount,
        manual_amount: manualAmount,
        listing_type: context.listing_type || '',
        lead_type: context.lead_type || '',
        buyer_type: context.buyer_type || '',
        is_private_inventory: Boolean(context.is_private_inventory),
        is_high_value: Boolean(context.is_high_value)
      },
      calculated_before_bounds: roundAmount(beforeBounds),
      calculated_after_bounds: grossAmount,
      conditions_json: rule.conditions_json || {}
    }
  };
}

function generateReference(prefix) {
  return `${prefix}-${Date.now()}`;
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
    if (!hasPermission(user, activeAssignments, ['revenue.approve', 'invoice.create', 'commission_rules.manage'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = await req.json();
    const {
      lead_id = '',
      deal_id = '',
      partner_id = '',
      event_type = '',
      event_date = new Date().toISOString(),
      trigger_source = 'manual',
      summary = '',
      payload_json = {},
      deal_value = 0,
      partner_commission_amount = 0,
      currency = 'AED',
      is_private_inventory = false,
      is_high_value = false,
      listing_type = '',
      lead_type = '',
      buyer_type = '',
      manual_amount = 0,
      tax_amount = 0
    } = payload;

    if (!event_type) {
      return Response.json({ error: 'event_type is required' }, { status: 400 });
    }

    const lead = lead_id ? await base44.asServiceRole.entities.Lead.get(lead_id) : null;
    const resolvedPartnerId = partner_id || lead?.assigned_partner_id || lead?.partner_agency_id || '';
    if (!resolvedPartnerId) {
      return Response.json({ error: 'partner_id could not be resolved' }, { status: 400 });
    }

    const context = {
      event_type,
      partner_id: resolvedPartnerId,
      project_id: payload_json.project_id || lead?.project_id || '',
      listing_type: listing_type || payload_json.listing_type || '',
      lead_type: lead_type || payload_json.lead_type || lead?.lead_type || '',
      buyer_type: buyer_type || payload_json.buyer_type || '',
      is_private_inventory: Boolean(is_private_inventory || lead?.is_private_inventory || payload_json.is_private_inventory),
      is_high_value: Boolean(is_high_value || lead?.is_high_value || payload_json.is_high_value),
      deal_value,
      partner_commission_amount,
      manual_amount,
      tax_amount
    };

    const rules = await base44.asServiceRole.entities.CommissionRule.list('-updated_date', 200);
    const selectedRule = rules
      .map((rule) => ({ rule, score: buildRuleScore(rule, context) }))
      .filter((item) => item.score >= 0)
      .sort((a, b) => b.score - a.score)[0]?.rule;

    if (!selectedRule) {
      return Response.json({ error: 'No active commission rule matched this trigger' }, { status: 400 });
    }

    const calculated = calculateAmount(selectedRule, context);
    const revenueEvent = await base44.asServiceRole.entities.RevenueEvent.create({
      lead_id,
      deal_id,
      partner_id: resolvedPartnerId,
      event_type,
      event_date: new Date(event_date).toISOString(),
      trigger_source,
      summary: summary || `Revenue trigger recorded: ${event_type}`,
      payload_json,
      created_by: user.id,
      deal_value: toNumber(deal_value),
      partner_commission_amount: toNumber(partner_commission_amount),
      currency,
      is_private_inventory: context.is_private_inventory,
      is_high_value: context.is_high_value,
      listing_type: context.listing_type,
      lead_type: context.lead_type,
      buyer_type: context.buyer_type
    });

    const entitlement = await base44.asServiceRole.entities.RevenueEntitlement.create({
      lead_id,
      deal_id,
      partner_id: resolvedPartnerId,
      commission_rule_id: selectedRule.id,
      revenue_event_id: revenueEvent.id,
      entitlement_status: 'pending_review',
      trigger_type: event_type,
      trigger_date: revenueEvent.event_date,
      calculation_snapshot_json: calculated.snapshot,
      gross_amount: calculated.grossAmount,
      tax_amount: calculated.taxAmount,
      net_amount: calculated.netAmount,
      paid_amount: 0,
      currency,
      notes: summary || `Entitlement created from ${event_type}`
    });

    const ledgerEntry = await base44.asServiceRole.entities.RevenueLedger.create({
      lead_id,
      partner_id: resolvedPartnerId,
      entitlement_id: entitlement.id,
      entry_type: 'accrual',
      amount: calculated.netAmount,
      currency,
      status: 'pending',
      entry_date: revenueEvent.event_date,
      reference_code: generateReference('REV'),
      summary: `Accrual recorded for ${event_type}`,
      balance_effect: 'credit',
      metadata_json: {
        revenue_event_id: revenueEvent.id,
        commission_rule_id: selectedRule.id
      }
    });

    await base44.asServiceRole.entities.Notification.create({
      title: 'Revenue entitlement pending review',
      body: `${summary || event_type} created an entitlement for ${resolvedPartnerId}.`,
      entitlement_id: entitlement.id,
      category: 'revenue',
      route_path: `/ops/revenue/${entitlement.id}`,
      channel: 'in_app',
      status: 'queued'
    });

    const audit = await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'RevenueEntitlement',
      entity_id: entitlement.id,
      action: 'revenue_entitlement_created',
      actor_id: user.id,
      actor_user_id: user.id,
      summary: `Revenue entitlement created from ${event_type}`,
      immutable: true,
      scope: 'finance',
      metadata: {
        commission_rule_id: selectedRule.id,
        revenue_event_id: revenueEvent.id,
        lead_id,
        partner_id: resolvedPartnerId,
        gross_amount: calculated.grossAmount,
        net_amount: calculated.netAmount
      }
    });

    return Response.json({ revenueEvent, entitlement, ledgerEntry, audit, rule: selectedRule });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
