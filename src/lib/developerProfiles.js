import { normalizeDeveloperQueryValue } from "@/lib/approvedDevelopers";
import { filterEntitySafe, listEntitySafe } from "@/lib/base44Safeguards";
import { showcaseDeveloperProfiles } from "@/data/showcaseProfiles";
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

function isPublicDeveloperProfile(profile) {
  return profile?.partnership_status === "partnered" && profile?.page_status === "published";
}

export async function listDeveloperProfiles() {
  const profiles = await listEntitySafe("DeveloperProfile", "-updated_date", 200);
  return Array.isArray(profiles) ? profiles.map(normalizeProfile) : [];
}

export async function getDeveloperProfileBySlug(slug) {
  const profiles = await filterEntitySafe("DeveloperProfile", { slug });
  const normalizedProfiles = Array.isArray(profiles) ? profiles.map(normalizeProfile) : [];
  const publishedProfile = normalizedProfiles.find(isPublicDeveloperProfile);
  if (publishedProfile) return publishedProfile;
  return getShowcaseDeveloperProfileBySlug(slug);
}

function mergeShowcaseProfiles(profiles = []) {
  const normalizedProfiles = Array.isArray(profiles) ? profiles.map(normalizeProfile) : [];
  const mergedProfiles = new Map(
    showcaseDeveloperProfiles.map(normalizeProfile).map((profile) => [profile.slug, profile])
  );

  normalizedProfiles
    .filter(isPublicDeveloperProfile)
    .forEach((profile) => {
      mergedProfiles.set(profile.slug, profile);
    });

  return Array.from(mergedProfiles.values());
}

export function getShowcaseDeveloperProfileBySlug(slug) {
  return showcaseDeveloperProfiles
    .map(normalizeProfile)
    .find((profile) => profile.slug === slug) || null;
}

export function getPublicDeveloperProfiles(profiles = []) {
  return mergeShowcaseProfiles(profiles).filter(isPublicDeveloperProfile);
}

export function getHomepageDeveloperProfiles(profiles = []) {
  return getPublicDeveloperProfiles(profiles).filter((profile) => profile.show_on_homepage);
}

export function findMatchingDeveloperProfile(profiles = [], developerName = "") {
  const normalizedName = normalizeDeveloperQueryValue(developerName);
  const slug = slugifyText(developerName);
  const sourceProfiles = mergeShowcaseProfiles(profiles);

  return sourceProfiles.find((profile) => (
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
