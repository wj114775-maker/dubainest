import { base44 } from "@/api/base44Client";
import { createAuditEntry } from "@/lib/audit";
import { createEntitySafe, filterEntitySafe, listEntitySafe, updateEntitySafe } from "@/lib/base44Safeguards";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { listProjectProfiles } from "@/lib/projectProfiles";
import { compactLabel } from "@/lib/revenue";

export const DEMO_OPERATIONAL_DEVELOPER_SLUG = "meraas-operations";
export const DEMO_OPERATIONAL_PROSPECT_COMPANY = "Nakheel Strategic Prospect";
export const DEMO_OPERATIONAL_LISTING_SLUG = "city-walk-crestlane-signature-residence";
export const DEMO_OPERATIONAL_DEAL_CODE = "DN-MERAAS-001";

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

function ensureWrite(result, fallbackMessage) {
  if (!result?.ok) {
    throw result?.error || new Error(fallbackMessage);
  }
  return result.data;
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

export function hasOperationalStarterWorkspace(workspace = {}) {
  return Boolean(
    (workspace.organisations || []).some((item) => item.slug === DEMO_OPERATIONAL_DEVELOPER_SLUG)
    && (workspace.deals || []).some((item) => item.deal_code === DEMO_OPERATIONAL_DEAL_CODE)
  );
}

export async function createDeveloperOperationalStarterSet({ currentUserId = "", workspace = {} } = {}) {
  const now = new Date();
  const nowIso = now.toISOString();
  const organisationOwner = currentUserId || "ops_demo_owner";
  const organisations = workspace.organisations || [];
  const prospects = workspace.prospects || [];
  const activities = workspace.activities || [];
  const agreements = workspace.agreements || [];
  const projects = workspace.projects || [];
  const listings = workspace.listings || [];
  const deals = workspace.deals || [];
  const listingRevisions = workspace.listingRevisions || [];
  const projectRevisions = workspace.projectRevisions || [];
  const documents = workspace.documents || [];
  const disputes = workspace.disputes || [];
  const entitlements = workspace.entitlements || [];

  let prospect = prospects.find((item) => item.company_name === DEMO_OPERATIONAL_PROSPECT_COMPANY) || null;
  if (!prospect) {
    prospect = ensureWrite(await createEntitySafe("DeveloperProspect", {
      company_name: DEMO_OPERATIONAL_PROSPECT_COMPANY,
      main_contact_name: "Aisha Rahman",
      email: "partnerships+nakheel@dubainest.local",
      phone: "+971500000111",
      source: "enterprise_outreach",
      owner_user_id: organisationOwner,
      stage: "meeting_booked",
      interest: "strategic",
      last_contact_at: nowIso,
      next_follow_up_at: new Date(now.getTime() + 4 * 86400000).toISOString(),
      agreement_status: "draft",
      signature_status: "not_sent",
      notes: "Operational starter prospect for the developer pipeline demo.",
    }), "Operational starter prospect could not be created");
  }

  let organisation = organisations.find((item) => item.slug === DEMO_OPERATIONAL_DEVELOPER_SLUG) || null;
  if (!organisation) {
    organisation = ensureWrite(await createEntitySafe("DeveloperOrganisation", {
      legal_name: "Meraas Development LLC",
      trading_name: "Meraas",
      slug: DEMO_OPERATIONAL_DEVELOPER_SLUG,
      status: "active",
      agreement_type: "exclusive_inventory_mandate",
      mandate_scope: "projects,listings,deals,documents",
      source: "signed_partner",
      owner_user_id: organisationOwner,
      portal_enabled: true,
      primary_contact_name: "Karim Al Mansoori",
      primary_contact_email: "developer.admin@dubainest.local",
      primary_contact_phone: "+971500000222",
      approved_developer_name: "Meraas",
      agreement_status: "signed",
      signature_status: "signed",
      primary_city: "Dubai",
      notes: "Operational starter signed developer organisation for the developer lifecycle workspace.",
      last_activity_at: nowIso,
      last_portal_login_at: nowIso,
    }), "Operational starter developer organisation could not be created");
  }

  if (!activities.some((item) => item.summary === "Starter outreach meeting booked with Nakheel Strategic Prospect")) {
    ensureWrite(await createDeveloperActivity({
      developer_prospect_id: prospect.id,
      activity_type: "meeting",
      direction: "outbound",
      actor_user_id: organisationOwner,
      occurred_at: nowIso,
      summary: "Starter outreach meeting booked with Nakheel Strategic Prospect",
      detail: "Initial enterprise outreach call converted into an in-person meeting.",
      next_follow_up_at: new Date(now.getTime() + 4 * 86400000).toISOString(),
    }), "Operational starter prospect activity could not be created");
  }

  if (!activities.some((item) => item.summary === "Starter signed developer onboarding completed for Meraas")) {
    ensureWrite(await createDeveloperActivity({
      developer_organisation_id: organisation.id,
      activity_type: "conversion",
      direction: "system",
      actor_user_id: organisationOwner,
      occurred_at: nowIso,
      summary: "Starter signed developer onboarding completed for Meraas",
      detail: "Portal access, agreements, inventory, and deal desk starter records created.",
    }), "Operational starter organisation activity could not be created");
  }

  let agreement = agreements.find((item) => item.developer_organisation_id === organisation.id && item.agreement_code === "MERAAS-2026-MANDATE") || null;
  if (!agreement) {
    agreement = ensureWrite(await createEntitySafe("DeveloperAgreement", {
      developer_organisation_id: organisation.id,
      agreement_code: "MERAAS-2026-MANDATE",
      agreement_type: "exclusive_inventory_mandate",
      mandate_scope: "projects,listings,deals,documents",
      agreement_status: "signed",
      signature_status: "signed",
      document_url: "https://example.com/documents/meraas-mandate.pdf",
      signed_document_url: "https://example.com/documents/meraas-mandate-signed.pdf",
      sent_at: nowIso,
      signed_at: nowIso,
      effective_date: "2026-01-01",
      expiry_date: "2026-12-31",
      notes: "Operational starter agreement for demo purposes.",
    }), "Operational starter agreement could not be created");
  }

  let project = projects.find((item) => item.slug === "city-walk-crestlane" && (item.developer_organisation_id === organisation.id || item.developer_id === organisation.id)) || null;
  if (!project) {
    project = ensureWrite(await createEntitySafe("Project", {
      developer_id: organisation.id,
      developer_organisation_id: organisation.id,
      name: "City Walk Crestlane",
      slug: "city-walk-crestlane",
      status: "under_construction",
      handover_date: "2028-12-31",
      trust_score: 88,
      verification_status: "verified",
      project_trust_band: "verified",
      authority_status: "valid",
      price_from: 2750000,
      brochure_url: "https://example.com/documents/city-walk-crestlane-brochure.pdf",
      floor_plan_url: "https://example.com/documents/city-walk-crestlane-floorplan.pdf",
      amenities: ["Lagoon pool", "Wellness club", "Private lounges", "Retail promenade"],
      payment_plan_summary: "20% on booking, 30% during construction, 50% on handover.",
      publication_status: "published",
      request_review_status: "approved",
    }), "Operational starter project could not be created");
  }

  let listing = listings.find((item) => item.slug === DEMO_OPERATIONAL_LISTING_SLUG) || null;
  if (!listing) {
    listing = ensureWrite(await createEntitySafe("Listing", {
      developer_id: organisation.id,
      developer_organisation_id: organisation.id,
      project_id: project.id,
      title: "City Walk Crestlane Signature Residence",
      slug: DEMO_OPERATIONAL_LISTING_SLUG,
      description: "A polished starter listing for the developer lifecycle workspace, linked to the signed developer, project, and active deal desk.",
      listing_type: "sale",
      property_type: "Apartment",
      price: 3980000,
      bedrooms: 3,
      bathrooms: 4,
      built_up_area_sqft: 2120,
      status: "published",
      verification_status: "verified",
      publication_status: "published",
      freshness_status: "fresh",
      trust_band: "verified",
      authority_status: "valid",
      permit_verified: true,
      title_deed_verified: true,
      project_status_verified: true,
      partner_verified: true,
      broker_verified: true,
      trust_score: 91,
      completeness_score: 96,
      freshness_score: 92,
      duplicate_risk_score: 4,
      issue_count: 0,
      evidence_count: 3,
      hero_image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2200&q=80",
      last_refreshed_at: nowIso,
      last_checked_at: nowIso,
      published_at: nowIso,
      is_private_inventory: false,
    }), "Operational starter listing could not be created");
  }

  if (!listingRevisions.some((item) => item.listing_id === listing.id && item.title === "City Walk Crestlane Signature Residence price refresh")) {
    ensureWrite(await createEntitySafe("DeveloperListingRevision", {
      developer_organisation_id: organisation.id,
      listing_id: listing.id,
      project_id: project.id,
      requested_by_user_id: organisationOwner,
      change_type: "price_refresh",
      review_status: "submitted",
      title: "City Walk Crestlane Signature Residence price refresh",
      description: listing.description,
      listing_type: listing.listing_type,
      property_type: listing.property_type,
      price: 4050000,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      built_up_area_sqft: listing.built_up_area_sqft,
      hero_image_url: listing.hero_image_url,
      submitted_at: nowIso,
      notes: "Operational starter pending listing revision for governance review.",
    }), "Operational starter listing revision could not be created");
  }

  if (!projectRevisions.some((item) => item.project_id === project.id && item.name === "City Walk Crestlane phased amenities update")) {
    ensureWrite(await createEntitySafe("DeveloperProjectRevision", {
      developer_organisation_id: organisation.id,
      project_id: project.id,
      requested_by_user_id: organisationOwner,
      change_type: "live_update",
      review_status: "submitted",
      name: "City Walk Crestlane phased amenities update",
      slug: project.slug,
      status: project.status,
      handover_date: project.handover_date,
      price_from: project.price_from,
      brochure_url: project.brochure_url,
      floor_plan_url: project.floor_plan_url,
      amenities: project.amenities || [],
      payment_plan_summary: project.payment_plan_summary,
      submitted_at: nowIso,
      notes: "Operational starter project revision for publication review.",
    }), "Operational starter project revision could not be created");
  }

  let deal = deals.find((item) => item.deal_code === DEMO_OPERATIONAL_DEAL_CODE) || null;
  if (!deal) {
    deal = ensureWrite(await createEntitySafe("DeveloperDeal", {
      deal_code: DEMO_OPERATIONAL_DEAL_CODE,
      buyer_name: "Sophie Mercer",
      listing_id: listing.id,
      project_id: project.id,
      developer_organisation_id: organisation.id,
      assigned_partner_id: "partner-demo-citywalk",
      assigned_broker_id: "broker-demo-crestlane",
      stage: "payment_milestones",
      reservation_status: "confirmed",
      contract_status: "spa_signed",
      payment_status: "partial",
      handover_status: "scheduled",
      sale_price: 3980000,
      expected_platform_fee: 79600,
      expected_commission: 119400,
      dispute_status: "none",
      expected_handover_at: "2028-12-15T10:00:00.000Z",
      notes: "Operational starter developer deal showing post-reservation progression.",
    }), "Operational starter deal could not be created");
  }

  if (!documents.some((item) => item.developer_organisation_id === organisation.id && item.title === "Meraas signed partnership agreement")) {
    ensureWrite(await createEntitySafe("SecureDocument", {
      case_id: organisation.id,
      developer_organisation_id: organisation.id,
      document_type: "signed_agreement",
      title: "Meraas signed partnership agreement",
      file_url: "https://example.com/documents/meraas-mandate-signed.pdf",
      visibility: "partner_visible",
      uploaded_by: organisationOwner,
      uploaded_at: nowIso,
      notes: "Operational starter signed agreement document.",
    }), "Operational starter signed agreement document could not be created");
  }

  if (!documents.some((item) => item.project_id === project.id && item.title === "City Walk Crestlane brochure")) {
    ensureWrite(await createEntitySafe("SecureDocument", {
      case_id: organisation.id,
      developer_organisation_id: organisation.id,
      project_id: project.id,
      document_type: "brochure",
      title: "City Walk Crestlane brochure",
      file_url: "https://example.com/documents/city-walk-crestlane-brochure.pdf",
      visibility: "partner_visible",
      uploaded_by: organisationOwner,
      uploaded_at: nowIso,
      notes: "Operational starter project brochure.",
    }), "Operational starter brochure document could not be created");
  }

  if (!documents.some((item) => item.deal_id === deal.id && item.title === "Reservation form - DN-MERAAS-001")) {
    ensureWrite(await createEntitySafe("SecureDocument", {
      case_id: organisation.id,
      developer_organisation_id: organisation.id,
      project_id: project.id,
      listing_id: listing.id,
      deal_id: deal.id,
      document_type: "reservation_form",
      title: "Reservation form - DN-MERAAS-001",
      file_url: "https://example.com/documents/dn-meraas-001-reservation-form.pdf",
      visibility: "partner_visible",
      uploaded_by: organisationOwner,
      uploaded_at: nowIso,
      notes: "Operational starter reservation document for the deal desk.",
    }), "Operational starter reservation document could not be created");
  }

  if (!disputes.some((item) => item.developer_deal_id === deal.id)) {
    ensureWrite(await createEntitySafe("RevenueDispute", {
      partner_id: deal.assigned_partner_id,
      developer_organisation_id: organisation.id,
      developer_deal_id: deal.id,
      dispute_type: "documentation_dispute",
      summary: "Developer requested revised milestone proof before final collection.",
      status: "open",
      severity: "medium",
      opened_by: organisationOwner,
      opened_at: nowIso,
      notes: "Operational starter dispute for the finance summary and dispute workflow.",
    }), "Operational starter dispute could not be created");
  }

  if (!entitlements.some((item) => item.developer_deal_id === deal.id)) {
    ensureWrite(await createEntitySafe("RevenueEntitlement", {
      deal_id: deal.id,
      developer_organisation_id: organisation.id,
      developer_deal_id: deal.id,
      partner_id: deal.assigned_partner_id,
      trigger_type: "reservation_made",
      trigger_date: nowIso,
      entitlement_status: "approved",
      gross_amount: 79600,
      tax_amount: 0,
      net_amount: 79600,
      paid_amount: 0,
      currency: "AED",
      notes: "Operational starter entitlement linked to the developer deal workflow.",
      approved_by: organisationOwner,
      approved_at: nowIso,
    }), "Operational starter entitlement could not be created");
  }

  return {
    prospect,
    organisation,
    agreement,
    project,
    listing,
    deal,
  };
}

export async function getDeveloperOrganisationById(id = "") {
  const organisations = await listEntitySafe("DeveloperOrganisation", "-updated_date", 200);
  return organisations.find((item) => item.id === id) || null;
}

export async function getDeveloperRecordsBySlug(slug = "") {
  const organisations = await filterEntitySafe("DeveloperOrganisation", { slug });
  return organisations[0] || null;
}
