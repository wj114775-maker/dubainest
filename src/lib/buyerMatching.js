import { listEntitySafe } from "@/lib/base44Safeguards";

function toKey(value = "") {
  return String(value || "").trim().toLowerCase();
}

function toTimestamp(value = "") {
  const date = new Date(value || 0);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function sortNewest(items = []) {
  return [...items].sort((left, right) => (
    toTimestamp(right.updated_date || right.created_date || right.trigger_date || right.scheduled_at || right.opened_at)
    - toTimestamp(left.updated_date || left.created_date || left.trigger_date || left.scheduled_at || left.opened_at)
  ));
}

function parseListValue(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!String(value || "").trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean);
    }
  } catch {
    // Fall through to delimiter parsing.
  }

  return String(value || "")
    .split(/[,\n|]/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueStrings(values = []) {
  return Array.from(new Set(values.filter(Boolean).map((item) => String(item))));
}

function getLeadListingIds(lead = {}) {
  return uniqueStrings([
    lead.listing_id,
    lead.first_property_id,
    lead.first_listing_id,
    ...parseListValue(lead.listing_ids),
    ...parseListValue(lead.shortlisted_listing_ids),
    ...parseListValue(lead.compare_listing_ids),
  ]);
}

function getLeadProjectIds(lead = {}) {
  return uniqueStrings([
    lead.project_id,
    lead.first_project_id,
    ...parseListValue(lead.project_ids),
  ]);
}

function getLeadIdentity(lead, leadIdentities = []) {
  const matches = leadIdentities.filter((item) => item.lead_id === lead.id);
  return matches.find((item) => item.is_primary_identity) || matches[0] || null;
}

function getOwnerLabel(assignment, conciergeCase) {
  return (
    assignment?.partner_id
    || assignment?.internal_owner_id
    || conciergeCase?.assigned_concierge_id
    || "Unassigned"
  );
}

function budgetEdge(lead, key) {
  const numericValue = Number(lead?.[key] || 0);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
}

function formatCompactCurrency(value = 0, currency = "AED") {
  if (!Number.isFinite(Number(value)) || Number(value) <= 0) return "Budget TBC";
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    notation: value >= 1000000 ? "compact" : "standard",
  }).format(value);
}

export function formatBuyerBudgetRange(match = {}) {
  const min = budgetEdge(match.lead, "budget_min");
  const max = budgetEdge(match.lead, "budget_max");
  if (min && max) return `${formatCompactCurrency(min)} - ${formatCompactCurrency(max)}`;
  if (max) return `Up to ${formatCompactCurrency(max)}`;
  if (min) return `From ${formatCompactCurrency(min)}`;
  return "Budget TBC";
}

export async function listBuyerMatchingWorkspace() {
  const [leads, leadIdentities, viewings, leadAssignments, conciergeCases] = await Promise.all([
    listEntitySafe("Lead", "-updated_date", 400),
    listEntitySafe("LeadIdentity", "-updated_date", 400),
    listEntitySafe("Viewing", "-updated_date", 400),
    listEntitySafe("LeadAssignment", "-updated_date", 300),
    listEntitySafe("ConciergeCase", "-updated_date", 200),
  ]);

  return {
    leads: sortNewest(leads),
    leadIdentities: sortNewest(leadIdentities),
    viewings: sortNewest(viewings),
    leadAssignments: sortNewest(leadAssignments),
    conciergeCases: sortNewest(conciergeCases),
  };
}

export function buildBuyerMatchSummary({
  leads = [],
  leadIdentities = [],
  viewings = [],
  leadAssignments = [],
  conciergeCases = [],
  deals = [],
  listingIds = [],
  projectIds = [],
  leadIds = [],
} = {}) {
  const listingIdSet = new Set(uniqueStrings(listingIds));
  const projectIdSet = new Set(uniqueStrings(projectIds));
  const explicitLeadIdSet = new Set(uniqueStrings(leadIds));
  const leadAssignmentByLeadId = new Map(sortNewest(leadAssignments).map((item) => [item.lead_id, item]));
  const conciergeByLeadId = new Map(sortNewest(conciergeCases).map((item) => [item.lead_id, item]));
  const viewingsByLeadId = viewings.reduce((accumulator, item) => {
    if (!item?.lead_id) return accumulator;
    accumulator[item.lead_id] = accumulator[item.lead_id] || [];
    accumulator[item.lead_id].push(item);
    return accumulator;
  }, {});
  const dealsByLeadId = deals.reduce((accumulator, item) => {
    if (!item?.lead_id) return accumulator;
    accumulator[item.lead_id] = accumulator[item.lead_id] || [];
    accumulator[item.lead_id].push(item);
    return accumulator;
  }, {});

  const matches = leads.reduce((accumulator, lead) => {
    const directListingIds = getLeadListingIds(lead);
    const directProjectIds = getLeadProjectIds(lead);
    const leadViewings = viewingsByLeadId[lead.id] || [];
    const viewingListingIds = uniqueStrings(leadViewings.map((item) => item.listing_id));
    const relatedDeals = dealsByLeadId[lead.id] || [];
    const reasons = [];

    if (explicitLeadIdSet.has(lead.id)) reasons.push("live deal");
    if (directListingIds.some((item) => listingIdSet.has(item))) reasons.push("listing enquiry");
    if (directProjectIds.some((item) => projectIdSet.has(item))) reasons.push("project enquiry");
    if (viewingListingIds.some((item) => listingIdSet.has(item))) reasons.push("viewing booked");

    if (!reasons.length) return accumulator;

    const identity = getLeadIdentity(lead, leadIdentities);
    const assignment = leadAssignmentByLeadId.get(lead.id) || null;
    const conciergeCase = conciergeByLeadId.get(lead.id) || null;
    const latestActivityAt = lead.last_touch_at || lead.updated_date || lead.created_date || "";
    const matchScore = (
      (reasons.includes("live deal") ? 50 : 0)
      + (reasons.includes("viewing booked") ? 25 : 0)
      + (reasons.includes("listing enquiry") ? 15 : 0)
      + (reasons.includes("project enquiry") ? 10 : 0)
    );

    accumulator.push({
      id: lead.id,
      lead,
      identity,
      assignment,
      conciergeCase,
      relatedDeals,
      reasons,
      ownerLabel: getOwnerLabel(assignment, conciergeCase),
      displayName: identity?.full_name || identity?.email_normalised || lead.lead_code || lead.id,
      intentLabel: [lead.intent_type || lead.source || "Buyer inquiry", lead.country || null].filter(Boolean).join(" · "),
      budgetLabel: formatBuyerBudgetRange({ lead }),
      latestActivityAt,
      matchScore,
      isPremium: Boolean(lead.is_private_inventory || lead.is_high_value || conciergeCase),
      hasViewing: reasons.includes("viewing booked"),
    });
    return accumulator;
  }, []);

  const sortedMatches = matches.sort((left, right) => {
    if (left.matchScore !== right.matchScore) return right.matchScore - left.matchScore;
    return toTimestamp(right.latestActivityAt) - toTimestamp(left.latestActivityAt);
  });

  const activeMatches = sortedMatches.filter((item) => !["won", "lost", "merged", "blocked"].includes(toKey(item.lead.status)));
  const premiumMatches = sortedMatches.filter((item) => item.isPremium);
  const protectedMatches = sortedMatches.filter((item) => ["locked", "protected", "override_pending"].includes(toKey(item.lead.ownership_status)));
  const openDealCount = new Set(
    sortedMatches
      .flatMap((item) => item.relatedDeals)
      .filter((item) => !["closed", "cancelled"].includes(toKey(item.stage)))
      .map((item) => item.id)
  ).size;
  const budgetValues = sortedMatches.flatMap((item) => [budgetEdge(item.lead, "budget_min"), budgetEdge(item.lead, "budget_max")]).filter((item) => item > 0);
  const topIntents = Object.entries(sortedMatches.reduce((accumulator, item) => {
    const key = item.lead.intent_type || item.lead.source || "buyer_inquiry";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {}))
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([label, count]) => ({ label, count }));

  return {
    matches: sortedMatches,
    totalMatches: sortedMatches.length,
    activeMatches: activeMatches.length,
    premiumMatches: premiumMatches.length,
    protectedMatches: protectedMatches.length,
    withViewings: sortedMatches.filter((item) => item.hasViewing).length,
    openDeals: openDealCount,
    budgetFloor: budgetValues.length ? Math.min(...budgetValues) : 0,
    budgetCeiling: budgetValues.length ? Math.max(...budgetValues) : 0,
    topIntents,
  };
}
