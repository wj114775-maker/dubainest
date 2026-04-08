import { base44 } from "@/api/base44Client";
import { createAuditEntry } from "@/lib/audit";
import { createEntitySafe, filterEntitySafe, listEntitySafe, updateEntitySafe } from "@/lib/base44Safeguards";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { listProjectProfiles } from "@/lib/projectProfiles";
import { compactLabel } from "@/lib/revenue";

export const developerProspectStageOptions = [
  "uncontacted",
  "contacted",
  "replied",
  "meeting_booked",
  "negotiating",
  "agreement_sent",
  "awaiting_signature",
  "signed",
  "onboarding",
  "active",
  "paused",
  "not_interested",
  "archived",
];

export const developerInterestOptions = ["low", "medium", "high", "strategic"];
export const developerOrganisationStatusOptions = ["signed", "onboarding", "active", "paused", "archived"];
export const developerAgreementStatusOptions = ["not_sent", "draft", "sent", "awaiting_signature", "signed", "expired"];
export const developerSignatureStatusOptions = ["not_sent", "pending", "signed", "declined"];
export const developerDealStageOptions = ["active", "reservation_pending", "contract_pending", "payment_milestones", "handover_pending", "closed", "cancelled"];
export const developerDocumentTypeOptions = ["agreement_pdf", "signed_agreement", "brochure", "floor_plan", "reservation_form", "spa_document", "payment_evidence", "handover_doc", "shared_request_doc", "other"];
export const developerActivityTypeOptions = ["call", "email", "meeting", "note", "agreement_sent", "reminder", "conversion", "portal_access", "document_shared"];

const ACTIVE_MEMBERSHIP_STATUSES = new Set(["active", "invited", "pending", "verified"]);
const DEVELOPER_ADMIN_TYPES = new Set(["developer_admin", "organisation_admin", "company_admin"]);

function sortByUpdatedDateDesc(items = []) {
  return [...items].sort((a, b) => new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0));
}

function toKey(value = "") {
  return String(value || "").trim().toLowerCase();
}

function splitScopeTokens(value = "") {
  if (!String(value || "").trim()) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => toKey(item)).filter(Boolean);
    }
  } catch {
    // Fall through to delimiter-based parsing.
  }

  return String(value || "")
    .split(/[,\n|]/g)
    .map((item) => toKey(item))
    .filter(Boolean);
}

export function isDeveloperMembership(membership) {
  return toKey(membership?.organisation_type) === "developer_organisation";
}

export function getActiveDeveloperMemberships(memberships = []) {
  return memberships.filter((membership) => isDeveloperMembership(membership) && ACTIVE_MEMBERSHIP_STATUSES.has(toKey(membership.status || "active")));
}

export function selectPrimaryDeveloperMembership(memberships = []) {
  const activeMemberships = getActiveDeveloperMemberships(memberships);
  return activeMemberships.sort((a, b) => {
    const aActive = toKey(a.status) === "active";
    const bActive = toKey(b.status) === "active";
    if (aActive === bActive) return new Date(b.updated_date || b.created_date || 0) - new Date(a.updated_date || a.created_date || 0);
    return Number(bActive) - Number(aActive);
  })[0] || null;
}

export function isDeveloperAdminMembership(membership) {
  return DEVELOPER_ADMIN_TYPES.has(toKey(membership?.membership_type));
}

export function getDeveloperMembershipCapabilities(membership) {
  const scopeTokens = new Set(splitScopeTokens(membership?.assignment_scope));
  const isAdmin = isDeveloperAdminMembership(membership);
  return {
    canEditProjects: isAdmin || scopeTokens.has("projects") || scopeTokens.has("projects.manage"),
    canEditListings: isAdmin || scopeTokens.has("listings") || scopeTokens.has("listings.manage"),
    canViewDeals: isAdmin || scopeTokens.has("deals") || scopeTokens.has("deals.view"),
    canUploadDocuments: isAdmin || scopeTokens.has("documents") || scopeTokens.has("documents.upload"),
    canManageAccount: isAdmin || scopeTokens.has("account") || scopeTokens.has("account.manage"),
  };
}

export function filterDocumentsForDeveloper({ documents = [], organisationId = "", projectIds = [], listingIds = [], dealIds = [] }) {
  const projectIdSet = new Set(projectIds.filter(Boolean));
  const listingIdSet = new Set(listingIds.filter(Boolean));
  const dealIdSet = new Set(dealIds.filter(Boolean));

  return documents.filter((item) => (
    item.developer_organisation_id === organisationId
    || item.case_id === organisationId
    || projectIdSet.has(item.project_id)
    || listingIdSet.has(item.listing_id)
    || dealIdSet.has(item.deal_id)
  ));
}

export function buildDeveloperInventoryTree(organisations = [], projects = [], listings = []) {
  const projectCountsByOrganisation = new Map();
  const listingsByProjectId = projects.reduce((acc, project) => {
    acc[project.id] = listings.filter((listing) => listing.project_id === project.id);
    return acc;
  }, {});

  const tree = organisations.map((organisation) => {
    const organisationProjects = projects.filter((project) => (
      project.developer_organisation_id === organisation.id || project.developer_id === organisation.id
    ));
    projectCountsByOrganisation.set(organisation.id, organisationProjects.length);
    return {
      organisation,
      projects: organisationProjects.map((project) => ({
        project,
        listings: listingsByProjectId[project.id] || [],
      })),
      listingsWithoutProject: listings.filter((listing) => (
        (listing.developer_organisation_id === organisation.id || listing.developer_id === organisation.id)
        && !listing.project_id
      )),
    };
  });

  const organisationIds = new Set(organisations.map((item) => item.id));
  const projectIds = new Set(projects.map((item) => item.id));
  const orphanProjects = projects.filter((project) => !project.developer_organisation_id && !project.developer_id);
  const orphanListings = listings.filter((listing) => {
    const hasDeveloperLink = listing.developer_organisation_id || listing.developer_id;
    return !hasDeveloperLink || (listing.project_id && !projectIds.has(listing.project_id)) || (listing.developer_organisation_id && !organisationIds.has(listing.developer_organisation_id));
  });

  return {
    tree,
    projectCountsByOrganisation,
    orphanProjects,
    orphanListings,
    listingsWithoutProject: listings.filter((listing) => !listing.project_id),
  };
}

export function buildDeveloperFinanceSummary({ organisationId = "", deals = [], entitlements = [], disputes = [] }) {
  const organisationDeals = deals.filter((deal) => deal.developer_organisation_id === organisationId);
  const linkedDealIds = new Set(organisationDeals.map((deal) => deal.id));
  const organisationEntitlements = entitlements.filter((item) => item.developer_organisation_id === organisationId || linkedDealIds.has(item.developer_deal_id));
  const organisationDisputes = disputes.filter((item) => item.developer_organisation_id === organisationId || linkedDealIds.has(item.developer_deal_id));

  return {
    deals: organisationDeals.length,
    saleValue: organisationDeals.reduce((total, item) => total + Number(item.sale_price || 0), 0),
    expectedPlatformFee: organisationDeals.reduce((total, item) => total + Number(item.expected_platform_fee || 0), 0),
    expectedCommission: organisationDeals.reduce((total, item) => total + Number(item.expected_commission || 0), 0),
    openDisputes: organisationDisputes.filter((item) => !["resolved", "rejected", "closed"].includes(item.status)).length,
    approvedRevenue: organisationEntitlements.reduce((total, item) => total + Number(item.net_amount || item.gross_amount || 0), 0),
  };
}

export async function safeListOrganisationMemberships(query = {}) {
  try {
    if (Object.keys(query).length) {
      return await base44.entities.OrganisationMembership.filter(query);
    }
    return await base44.entities.OrganisationMembership.list("-updated_date", 300);
  } catch {
    return [];
  }
}

export async function safeListAuditLog(limit = 300) {
  try {
    return await base44.entities.AuditLog.list("-created_date", limit);
  } catch {
    return [];
  }
}

export async function listDeveloperOpsWorkspace() {
  const [
    organisations,
    prospects,
    activities,
    agreements,
    deals,
    listingRevisions,
    projectRevisions,
    memberships,
    projects,
    listings,
    documents,
    disputes,
    entitlements,
    developerProfiles,
    projectProfiles,
    auditLog,
  ] = await Promise.all([
    listEntitySafe("DeveloperOrganisation", "-updated_date", 200),
    listEntitySafe("DeveloperProspect", "-updated_date", 300),
    listEntitySafe("DeveloperActivity", "-updated_date", 400),
    listEntitySafe("DeveloperAgreement", "-updated_date", 200),
    listEntitySafe("DeveloperDeal", "-updated_date", 300),
    listEntitySafe("DeveloperListingRevision", "-updated_date", 300),
    listEntitySafe("DeveloperProjectRevision", "-updated_date", 300),
    safeListOrganisationMemberships({ organisation_type: "developer_organisation" }),
    listEntitySafe("Project", "-updated_date", 300),
    listEntitySafe("Listing", "-updated_date", 400),
    listEntitySafe("SecureDocument", "-updated_date", 300),
    listEntitySafe("RevenueDispute", "-updated_date", 200),
    listEntitySafe("RevenueEntitlement", "-updated_date", 200),
    listDeveloperProfiles(),
    listProjectProfiles(),
    safeListAuditLog(400),
  ]);

  return {
    organisations: sortByUpdatedDateDesc(organisations),
    prospects: sortByUpdatedDateDesc(prospects),
    activities: sortByUpdatedDateDesc(activities),
    agreements: sortByUpdatedDateDesc(agreements),
    deals: sortByUpdatedDateDesc(deals),
    listingRevisions: sortByUpdatedDateDesc(listingRevisions),
    projectRevisions: sortByUpdatedDateDesc(projectRevisions),
    memberships: sortByUpdatedDateDesc(memberships),
    projects: sortByUpdatedDateDesc(projects),
    listings: sortByUpdatedDateDesc(listings),
    documents: sortByUpdatedDateDesc(documents),
    disputes: sortByUpdatedDateDesc(disputes),
    entitlements: sortByUpdatedDateDesc(entitlements),
    developerProfiles: sortByUpdatedDateDesc(developerProfiles),
    projectProfiles: sortByUpdatedDateDesc(projectProfiles),
    auditLog: sortByUpdatedDateDesc(auditLog),
  };
}

export async function listDeveloperPortalWorkspace(userId = "") {
  const memberships = await safeListOrganisationMemberships(userId ? { user_id: userId } : {});
  const developerMemberships = getActiveDeveloperMemberships(memberships);
  const membership = selectPrimaryDeveloperMembership(developerMemberships);
  const organisationId = membership?.organisation_id || "";
  const organisationMembershipsPromise = organisationId
    ? safeListOrganisationMemberships({ organisation_id: organisationId, organisation_type: "developer_organisation" })
    : Promise.resolve([]);

  const [
    organisations,
    projects,
    listings,
    deals,
    listingRevisions,
    projectRevisions,
    documents,
    disputes,
    entitlements,
    notifications,
    organisationMemberships,
  ] = await Promise.all([
    listEntitySafe("DeveloperOrganisation", "-updated_date", 100),
    listEntitySafe("Project", "-updated_date", 200),
    listEntitySafe("Listing", "-updated_date", 300),
    listEntitySafe("DeveloperDeal", "-updated_date", 200),
    listEntitySafe("DeveloperListingRevision", "-updated_date", 300),
    listEntitySafe("DeveloperProjectRevision", "-updated_date", 300),
    listEntitySafe("SecureDocument", "-updated_date", 300),
    listEntitySafe("RevenueDispute", "-updated_date", 200),
    listEntitySafe("RevenueEntitlement", "-updated_date", 200),
    listEntitySafe("Notification", "-updated_date", 300),
    organisationMembershipsPromise,
  ]);

  const organisation = organisations.find((item) => item.id === organisationId) || null;
  const scopedProjects = projects.filter((item) => item.developer_organisation_id === organisationId || item.developer_id === organisationId);
  const projectIds = scopedProjects.map((item) => item.id);
  const scopedListings = listings.filter((item) => (
    item.developer_organisation_id === organisationId
    || item.developer_id === organisationId
    || projectIds.includes(item.project_id)
  ));
  const listingIds = scopedListings.map((item) => item.id);
  const scopedDeals = deals.filter((item) => item.developer_organisation_id === organisationId || listingIds.includes(item.listing_id) || projectIds.includes(item.project_id));
  const dealIds = scopedDeals.map((item) => item.id);

  return {
    memberships: developerMemberships,
    organisationMemberships: organisationMemberships.filter((item) => item.organisation_id === organisationId),
    membership,
    capabilities: getDeveloperMembershipCapabilities(membership),
    organisation,
    projects: scopedProjects,
    listings: scopedListings,
    deals: scopedDeals,
    listingRevisions: listingRevisions.filter((item) => item.developer_organisation_id === organisationId || listingIds.includes(item.listing_id)),
    projectRevisions: projectRevisions.filter((item) => item.developer_organisation_id === organisationId || projectIds.includes(item.project_id)),
    documents: filterDocumentsForDeveloper({ documents, organisationId, projectIds, listingIds, dealIds }),
    disputes: disputes.filter((item) => item.developer_organisation_id === organisationId || dealIds.includes(item.developer_deal_id)),
    entitlements: entitlements.filter((item) => item.developer_organisation_id === organisationId || dealIds.includes(item.developer_deal_id)),
    notifications: notifications.filter((item) => item.user_id === userId),
  };
}

export async function recordDeveloperAudit(entry) {
  try {
    await createAuditEntry(entry);
  } catch {
    // The feature should still work if AuditLog access is unavailable to the current user.
  }
}

export async function createDeveloperActivity(payload) {
  const result = await createEntitySafe("DeveloperActivity", payload);
  if (result.ok) {
    await recordDeveloperAudit({
      entity_name: "DeveloperActivity",
      entity_id: result.data?.id,
      action: payload.activity_type || "developer_activity_logged",
      summary: payload.summary || compactLabel(payload.activity_type || "activity_logged"),
      scope: "developer",
      immutable: true,
      metadata: payload,
    });
  }
  return result;
}

export async function createDeveloperAgreement(payload) {
  return createEntitySafe("DeveloperAgreement", payload);
}

export async function updateDeveloperEntity(entityName, id, payload) {
  return updateEntitySafe(entityName, id, payload);
}

export async function convertProspectToOrganisation({ prospect, currentUserId = "" }) {
  const now = new Date().toISOString();
  const organisationPayload = {
    legal_name: prospect.legal_name || prospect.company_name,
    trading_name: prospect.trading_name || prospect.company_name,
    status: "signed",
    agreement_status: prospect.agreement_status || "signed",
    signature_status: prospect.signature_status || "signed",
    source: prospect.source || "",
    owner_user_id: prospect.owner_user_id || currentUserId,
    primary_contact_name: prospect.main_contact_name || "",
    primary_contact_email: prospect.email || "",
    primary_contact_phone: prospect.phone || "",
    notes: prospect.notes || "",
    last_activity_at: now,
  };
  const organisationResult = await createEntitySafe("DeveloperOrganisation", organisationPayload);
  if (!organisationResult.ok) {
    return organisationResult;
  }

  await updateEntitySafe("DeveloperProspect", prospect.id, {
    developer_organisation_id: organisationResult.data.id,
    stage: "signed",
    agreement_status: prospect.agreement_status || "signed",
    signature_status: prospect.signature_status || "signed",
  });
  await createDeveloperActivity({
    developer_prospect_id: prospect.id,
    developer_organisation_id: organisationResult.data.id,
    activity_type: "conversion",
    direction: "system",
    actor_user_id: currentUserId,
    occurred_at: now,
    summary: `${prospect.company_name || prospect.legal_name || "Prospect"} converted to signed developer`,
  });
  return organisationResult;
}

export async function getDeveloperOrganisationById(id = "") {
  const organisations = await listEntitySafe("DeveloperOrganisation", "-updated_date", 200);
  return organisations.find((item) => item.id === id) || null;
}

export async function getDeveloperRecordsBySlug(slug = "") {
  const organisations = await filterEntitySafe("DeveloperOrganisation", { slug });
  return organisations[0] || null;
}
