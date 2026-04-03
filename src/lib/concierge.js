export const conciergeCaseTypeOptions = [
  "private_inventory",
  "concierge_standard",
  "concierge_premium",
  "relocation",
  "hnw",
  "family_office",
  "golden_visa",
  "multi_service"
];

export const conciergeCaseStatusOptions = [
  "new",
  "intake_in_progress",
  "qualification_complete",
  "nda_pending",
  "awaiting_documents",
  "ready_for_matching",
  "inventory_curation",
  "partner_matching",
  "viewing_planning",
  "active_service",
  "waiting_on_client",
  "waiting_on_partner",
  "deal_in_progress",
  "post_deal_services",
  "ready_for_closure",
  "closed_won",
  "closed_lost",
  "archived"
];

export const conciergePriorityOptions = ["standard", "priority", "premium", "urgent", "vip"];
export const conciergeTaskPriorityOptions = ["low", "normal", "high", "urgent"];
export const milestoneStatusOptions = ["pending", "in_progress", "blocked", "completed", "cancelled"];
export const taskStatusOptions = ["open", "in_progress", "blocked", "completed", "cancelled"];
export const ndaStatusOptions = ["pending", "sent", "signed", "expired", "revoked"];
export const serviceTypeOptions = ["legal", "mortgage", "visa", "company_setup", "relocation", "furnishing", "property_management", "school_advisory", "tax", "other"];
export const serviceStatusOptions = ["draft", "sent", "accepted", "in_progress", "completed", "rejected", "cancelled"];
export const documentVisibilityOptions = ["internal_only", "concierge_only", "partner_visible", "client_visible", "restricted_private"];
export const securityLevelOptions = ["standard", "confidential", "restricted_private", "hnw"];
export const confidentialityOptions = ["standard", "confidential", "restricted_private", "strict_need_to_know"];
export const noteTypeOptions = ["internal_update", "client_preference", "risk_note", "service_note", "viewing_note", "escalation", "partner_note"];

export function compactLabel(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isOpenCase(caseRecord) {
  return !["closed_won", "closed_lost", "archived"].includes(caseRecord?.case_status || "");
}

export function isOverdue(value) {
  return Boolean(value) && new Date(value) < new Date();
}

export function priorityRank(value = "standard") {
  return {
    standard: 1,
    priority: 2,
    premium: 3,
    urgent: 4,
    vip: 5
  }[value] || 0;
}
