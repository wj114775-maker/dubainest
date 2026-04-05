import { base44 } from "@/api/base44Client";
import { normalizeDeveloperQueryValue } from "@/lib/approvedDevelopers";
import { buildDeveloperDirectory, slugifyText } from "@/lib/developerDirectory";

function normalizeProfile(profile) {
  return {
    ...profile,
    featured_areas: Array.isArray(profile.featured_areas)
      ? profile.featured_areas
      : String(profile.featured_areas || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
  };
}

export async function listDeveloperProfiles() {
  try {
    const profiles = await base44.entities.DeveloperProfile.list("-updated_date", 200);
    return Array.isArray(profiles) ? profiles.map(normalizeProfile) : [];
  } catch {
    return [];
  }
}

export async function getDeveloperProfileBySlug(slug) {
  try {
    const profiles = await base44.entities.DeveloperProfile.filter({ slug });
    return profiles[0] ? normalizeProfile(profiles[0]) : null;
  } catch {
    return null;
  }
}

export function getPublicDeveloperProfiles(profiles = []) {
  return profiles.filter((profile) => (
    profile.partnership_status === "partnered" && profile.page_status === "published"
  ));
}

export function getHomepageDeveloperProfiles(profiles = []) {
  return getPublicDeveloperProfiles(profiles).filter((profile) => profile.show_on_homepage);
}

export function findMatchingDeveloperProfile(profiles = [], developerName = "") {
  const normalizedName = normalizeDeveloperQueryValue(developerName);
  const slug = slugifyText(developerName);

  return profiles.find((profile) => (
    profile.slug === slug
    || normalizeDeveloperQueryValue(profile.developer_name) === normalizedName
    || normalizeDeveloperQueryValue(profile.approved_developer_name) === normalizedName
  )) || null;
}

export function hydrateDeveloperProfile(profile, approvedDevelopers = [], listings = []) {
  const directory = buildDeveloperDirectory(approvedDevelopers, listings);
  const matchedDirectory = directory.find((item) => item.slug === profile.slug)
    || directory.find((item) => item.officialName === profile.approved_developer_name)
    || directory.find((item) => item.name === profile.developer_name);

  return {
    slug: profile.slug,
    name: profile.developer_name,
    officialName: profile.approved_developer_name || matchedDirectory?.officialName || profile.developer_name,
    officeNumber: profile.office_number || matchedDirectory?.officeNumber || "",
    logoUrl: profile.logo_url || matchedDirectory?.logoUrl || "",
    listingCount: matchedDirectory?.listingCount || 0,
    offPlanCount: matchedDirectory?.offPlanCount || 0,
    privateInventoryCount: matchedDirectory?.privateInventoryCount || 0,
    readyCount: matchedDirectory?.readyCount || 0,
    minPrice: matchedDirectory?.minPrice ?? null,
    maxPrice: matchedDirectory?.maxPrice ?? null,
    heroImageUrl: profile.hero_image_url || matchedDirectory?.heroImageUrl || "",
    topAreas: profile.featured_areas?.length ? profile.featured_areas : matchedDirectory?.topAreas || [],
    listings: matchedDirectory?.listings || [],
    headline: profile.headline || "",
    summary: profile.summary || "",
    body: profile.body || "",
    contactEmail: profile.contact_email || "",
    contactPhone: profile.contact_phone || "",
    primaryCity: profile.primary_city || "",
    brandColor: profile.brand_color || "",
    pageStatus: profile.page_status,
    partnershipStatus: profile.partnership_status,
    showOnHomepage: Boolean(profile.show_on_homepage),
    notes: profile.notes || "",
  };
}

export function buildManagedDeveloperDirectory(profiles = [], approvedDevelopers = [], listings = [], options = {}) {
  const sourceProfiles = options.homepageOnly
    ? getHomepageDeveloperProfiles(profiles)
    : getPublicDeveloperProfiles(profiles);

  return sourceProfiles.map((profile) => hydrateDeveloperProfile(profile, approvedDevelopers, listings));
}
