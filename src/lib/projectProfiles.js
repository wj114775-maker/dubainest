import { filterEntitySafe, listEntitySafe } from "@/lib/base44Safeguards";
import { showcaseProjectProfiles } from "@/data/showcaseProfiles";
import { findMatchingDeveloperProfile } from "@/lib/developerProfiles";
import { slugifyText } from "@/lib/developerDirectory";

function normalizeListField(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProjectProfile(profile) {
  return {
    ...profile,
    gallery_image_urls: normalizeListField(profile.gallery_image_urls),
    unit_types: normalizeListField(profile.unit_types),
    amenity_highlights: normalizeListField(profile.amenity_highlights),
    featured_listing_ids: normalizeListField(profile.featured_listing_ids),
  };
}

function normalizeCompareValue(value) {
  return String(value || "").trim().toLowerCase();
}

function deriveBedroomRange(listings = []) {
  const bedroomValues = listings
    .map((listing) => Number(listing.bedrooms || 0))
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (!bedroomValues.length) return "";
  const min = Math.min(...bedroomValues);
  const max = Math.max(...bedroomValues);
  return min === max ? String(min) : `${min}-${max}`;
}

function deriveProjectStatus(profile, project, listings) {
  if (profile.project_status_override) return profile.project_status_override;
  if (project?.status) return project.status;
  if (listings.some((item) => item.is_off_plan)) return "under_construction";
  if (listings.length) return "completed";
  return "planned";
}

function orderFeaturedListings(listings = [], featuredListingIds = []) {
  const order = new Map(featuredListingIds.map((id, index) => [id, index]));
  return [...listings].sort((left, right) => (
    (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER)
    || Number(left.price || 0) - Number(right.price || 0)
  ));
}

export async function listProjectProfiles() {
  const profiles = await listEntitySafe("ProjectProfile", "-updated_date", 200);
  return Array.isArray(profiles) ? profiles.map(normalizeProjectProfile) : [];
}

export async function getProjectProfileBySlug(slug) {
  const profiles = await filterEntitySafe("ProjectProfile", { slug });
  if (profiles[0]) return normalizeProjectProfile(profiles[0]);
  return getShowcaseProjectProfileBySlug(slug);
}

function mergeShowcaseProjectProfiles(profiles = []) {
  const normalizedProfiles = Array.isArray(profiles) ? profiles.map(normalizeProjectProfile) : [];
  const publicProfiles = normalizedProfiles.filter((profile) => profile.page_status === "published");

  if (publicProfiles.length) return normalizedProfiles;
  return showcaseProjectProfiles.map(normalizeProjectProfile);
}

export function getShowcaseProjectProfileBySlug(slug) {
  return showcaseProjectProfiles
    .map(normalizeProjectProfile)
    .find((profile) => profile.slug === slug) || null;
}

export function getPublicProjectProfiles(profiles = []) {
  return mergeShowcaseProjectProfiles(profiles).filter((profile) => profile.page_status === "published");
}

export function getHomepageProjectProfiles(profiles = []) {
  return getPublicProjectProfiles(profiles).filter((profile) => profile.show_on_homepage);
}

export function findProjectProfileForListing(listing, profiles = []) {
  const listingProjectId = String(listing?.project_id || "").trim();
  const listingProjectName = normalizeCompareValue(listing?.project_name);
  const sourceProfiles = mergeShowcaseProjectProfiles(profiles);

  return sourceProfiles.find((profile) => (
    profile.featured_listing_ids?.includes(listing?.id)
    || (listingProjectId && String(profile.project_id || "").trim() === listingProjectId)
    || (listingProjectName && normalizeCompareValue(profile.project_name) === listingProjectName)
  )) || null;
}

export function hydrateProjectProfile(profile, projects = [], listings = [], developerProfiles = []) {
  const matchedProject = projects.find((project) => (
    (profile.project_id && project.id === profile.project_id)
    || project.slug === profile.slug
    || normalizeCompareValue(project.name) === normalizeCompareValue(profile.project_name)
  )) || null;

  const relatedListings = listings.filter((listing) => (
    profile.featured_listing_ids.includes(listing.id)
    || (profile.project_id && listing.project_id === profile.project_id)
    || (profile.project_name && normalizeCompareValue(listing.project_name) === normalizeCompareValue(profile.project_name))
  ));

  const orderedListings = orderFeaturedListings(relatedListings, profile.featured_listing_ids);
  const featuredListings = orderedListings.slice(0, 6);
  const minPrice = profile.starting_price_override
    ?? matchedProject?.price_from
    ?? (orderedListings.length ? Math.min(...orderedListings.map((item) => Number(item.price || 0)).filter(Boolean)) : null);
  const developerProfile = profile.developer_profile_slug
    ? developerProfiles.find((item) => item.slug === profile.developer_profile_slug) || null
    : findMatchingDeveloperProfile(developerProfiles, profile.developer_name || orderedListings[0]?.developer_name || "");
  const publicDeveloperProfile = developerProfile
    && developerProfile.partnership_status === "partnered"
    && developerProfile.page_status === "published"
      ? developerProfile
      : null;
  const galleryFromListings = orderedListings.flatMap((listing) => listing.gallery_image_urls || []).filter(Boolean);

  return {
    id: profile.id,
    projectId: profile.project_id || matchedProject?.id || "",
    slug: profile.slug || slugifyText(profile.project_name || matchedProject?.name),
    name: profile.project_name || matchedProject?.name || "Project",
    headline: profile.headline || "",
    summary: profile.summary || "",
    body: profile.body || "",
    heroImageUrl: profile.hero_image_url || matchedProject?.hero_image_url || orderedListings[0]?.hero_image_url || "",
    galleryImageUrls: profile.gallery_image_urls.length ? profile.gallery_image_urls : Array.from(new Set(galleryFromListings)).slice(0, 6),
    brochureUrl: profile.brochure_url || "",
    floorPlanUrl: profile.floor_plan_url || "",
    paymentPlanSummary: profile.payment_plan_summary || "",
    unitTypes: profile.unit_types.length ? profile.unit_types : Array.from(new Set(orderedListings.map((listing) => listing.property_type).filter(Boolean))).slice(0, 6),
    bedroomRange: profile.bedroom_range || deriveBedroomRange(orderedListings),
    amenityHighlights: profile.amenity_highlights,
    featuredListings,
    areaName: profile.area_name || orderedListings[0]?.area_name || matchedProject?.area_name || profile.primary_city || "Dubai",
    primaryCity: profile.primary_city || "Dubai",
    status: deriveProjectStatus(profile, matchedProject, orderedListings),
    handoverLabel: profile.handover_label_override || matchedProject?.handover_date || orderedListings.find((listing) => listing.handover_label)?.handover_label || "TBC",
    priceFrom: minPrice,
    pageStatus: profile.page_status,
    showOnHomepage: Boolean(profile.show_on_homepage),
    contactEmail: profile.contact_email || publicDeveloperProfile?.contact_email || "",
    contactPhone: profile.contact_phone || publicDeveloperProfile?.contact_phone || "",
    seoTitle: profile.seo_title || "",
    seoDescription: profile.seo_description || "",
    notes: profile.notes || "",
    developerName: profile.developer_name || publicDeveloperProfile?.developer_name || orderedListings[0]?.developer_name || "",
    developerSlug: publicDeveloperProfile?.slug || "",
    developerSummary: publicDeveloperProfile?.summary || "",
  };
}

export function buildManagedProjectDirectory(profiles = [], projects = [], listings = [], developerProfiles = [], options = {}) {
  const sourceProfiles = options.homepageOnly
    ? getHomepageProjectProfiles(profiles)
    : getPublicProjectProfiles(profiles);

  return sourceProfiles.map((profile) => hydrateProjectProfile(profile, projects, listings, developerProfiles));
}
