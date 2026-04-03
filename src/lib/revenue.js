export const triggerTypeOptions = [
  "lead_accepted",
  "qualified_appointment_booked",
  "viewing_completed",
  "reservation_made",
  "offer_accepted",
  "deal_exchanged",
  "deal_completed",
  "partner_commission_received",
  "milestone_payment_received",
  "manual"
];

export const disputeTypeOptions = [
  "attribution_dispute",
  "lead_ownership_dispute",
  "fee_amount_dispute",
  "trigger_dispute",
  "duplicate_lead_dispute",
  "partner_bypass_dispute",
  "partial_payment_dispute",
  "cancellation_dispute",
  "clawback_dispute",
  "documentation_dispute"
];

export const severityOptions = ["low", "medium", "high", "critical"];
export const evidenceTypeOptions = ["deal_proof", "partner_statement", "payment_receipt", "internal_approval_note", "agreement_addendum", "invoice_pdf", "settlement_note", "commercial_note", "other"];
export const paymentMethodOptions = ["bank_transfer", "cheque", "cash", "wallet", "other"];
export const settlementTypeOptions = ["commercial_settlement", "dispute_resolution", "clawback_plan", "writeoff_settlement"];
export const adjustmentTypeOptions = ["manual_adjustment", "reversal", "clawback", "writeoff", "settlement_adjustment"];

export function formatCurrency(amount = 0, currency = "AED") {
  const numericAmount = Number(amount || 0);
  try {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(numericAmount);
  } catch (error) {
    return `${currency} ${numericAmount.toLocaleString()}`;
  }
}

export function isOverdueDate(value) {
  return Boolean(value) && new Date(value) < new Date();
}

export function getEntitlementAmount(entitlement) {
  return Number(entitlement?.net_amount ?? entitlement?.gross_amount ?? 0);
}

export function getOpenBalance(entitlement, payout) {
  const expected = Number(payout?.expected_amount ?? entitlement?.net_amount ?? entitlement?.gross_amount ?? 0);
  const paid = Number(payout?.paid_amount ?? entitlement?.paid_amount ?? 0);
  return expected - paid;
}

export function compactLabel(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
