export const buyerPipelineStages = [
  {
    id: "capture",
    label: "Capture",
    description: "New inquiries and first qualification."
  },
  {
    id: "protect",
    label: "Protect",
    description: "Ownership, routing, and handoff."
  },
  {
    id: "supply",
    label: "Supply",
    description: "Matching, private stock, and verification."
  },
  {
    id: "journey",
    label: "Journey",
    description: "Viewings, NDA, and active buyer handling."
  },
  {
    id: "money",
    label: "Money",
    description: "Commercial tracking and closeout."
  },
  {
    id: "closed",
    label: "Closed",
    description: "Won, lost, blocked, or merged."
  }
];

export const buyerPipelineStageOptions = buyerPipelineStages.map((stage) => stage.id);
export const buyerPipelineClosedOutcomes = ["won", "lost", "blocked"];

const closedLeadStatuses = new Set(["lost", "merged", "blocked"]);
const openRevenueStatuses = new Set(["draft", "pending_review", "approved", "invoiced", "awaiting_payment", "partially_paid", "disputed", "adjusted"]);
const journeyConciergeStatuses = new Set(["active_service", "waiting_on_client", "waiting_on_partner", "deal_in_progress", "post_deal_services", "ready_for_closure"]);
const supplyConciergeStatuses = new Set(["nda_pending", "awaiting_documents", "ready_for_matching", "inventory_curation", "partner_matching", "viewing_planning", "qualification_complete"]);
const supplyListingStatuses = new Set(["under_review", "verification_pending", "flagged", "frozen", "stale"]);
const supplyListingFreshness = new Set(["stale", "expired"]);

export function compactLabel(value = "") {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function isClosedBuyerCase(caseRecord) {
  return caseRecord.pipeline_stage === "closed";
}

export function getBuyerPipelineStage(caseRecord) {
  const lead = caseRecord.lead || {};
  const conciergeCase = caseRecord.conciergeCase || null;
  const latestRevenue = caseRecord.latestRevenue || null;
  const relatedListings = caseRecord.relatedListings || [];
  const explicitStage = buyerPipelineStageOptions.includes(lead.current_stage) ? lead.current_stage : "";
  const hasSupplyIssue = relatedListings.some((listing) => supplyListingStatuses.has(listing.status) || supplyListingFreshness.has(listing.freshness_status));
  const hasViewings = (caseRecord.viewings || []).length > 0;
  const hasAssignment = Boolean(caseRecord.assignment?.partner_id || caseRecord.assignment?.internal_owner_id || lead.assigned_partner_id);
  const protectedLead = ["locked", "protected", "soft_owned", "override_pending"].includes(lead.ownership_status);

  if (explicitStage) {
    return explicitStage;
  }

  if (closedLeadStatuses.has(lead.status) || lead.status === "won" && !latestRevenue) {
    return "closed";
  }

  if (latestRevenue && openRevenueStatuses.has(latestRevenue.entitlement_status || "")) {
    return "money";
  }

  if (lead.status === "won") {
    return "money";
  }

  if (conciergeCase && journeyConciergeStatuses.has(conciergeCase.case_status || "")) {
    return "journey";
  }

  if (
    hasSupplyIssue
    || lead.is_private_inventory
    || conciergeCase && supplyConciergeStatuses.has(conciergeCase.case_status || "")
  ) {
    return "supply";
  }

  if (
    hasViewings
    || lead.status === "active"
    || [
      "accepted",
      "contact_in_progress",
      "callback_booked",
      "viewing_booked",
      "viewing_completed",
      "offer_in_discussion",
      "reserved",
      "assigned"
    ].includes(lead.status)
  ) {
    return "journey";
  }

  if (hasAssignment || protectedLead) {
    return "protect";
  }

  return "capture";
}

export function getBuyerPipelineNextAction(caseRecord) {
  switch (caseRecord.pipeline_stage) {
    case "capture":
      return "Qualify the buyer and confirm intent.";
    case "protect":
      return caseRecord.assignment?.assignment_status === "pending"
        ? "Push partner acceptance or re-route the case."
        : "Confirm ownership and next owner.";
    case "supply":
      return caseRecord.hasSupplyIssue
        ? "Resolve listing trust or freshness blockers."
        : "Curate stock and move toward viewings.";
    case "journey":
      return caseRecord.conciergeCase
        ? "Advance the premium journey and clear the next task."
        : "Move the buyer through contact, viewings, or offer.";
    case "money":
      return "Track entitlement, invoice, or dispute resolution.";
    case "closed":
      return caseRecord.lead?.status === "won" ? "Review the commercial outcome." : "No active work remains.";
    default:
      return "Review the case.";
  }
}
