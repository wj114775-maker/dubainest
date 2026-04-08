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

function normalizeSlugIdentifier(value) {
  return slugifyText(value);
}

function matchesDeveloperIdentifier(profile, value) {
  const normalizedName = normalizeDeveloperQueryValue(value);
  const normalizedSlug = normalizeSlugIdentifier(value);

  return (
    profile?.slug === normalizedSlug
    || normalizeSlugIdentifier(profile?.slug) === normalizedSlug
    || normalizeDeveloperQueryValue(profile?.developer_name) === normalizedName
    || normalizeDeveloperQueryValue(profile?.approved_developer_name) === normalizedName
  );
}

export async function listDeveloperProfiles() {
  const profiles = await listEntitySafe("DeveloperProfile", "-updated_date", 200);
  return Array.isArray(profiles) ? profiles.map(normalizeProfile) : [];
}

export async function getDeveloperProfileBySlug(slug) {
  const normalizedSlug = normalizeSlugIdentifier(slug);
  const profiles = await filterEntitySafe("DeveloperProfile", { slug: normalizedSlug });
  const normalizedProfiles = Array.isArray(profiles) ? profiles.map(normalizeProfile) : [];
  const publishedProfile = normalizedProfiles.find((profile) => (
    isPublicDeveloperProfile(profile) && matchesDeveloperIdentifier(profile, slug)
  ));
  if (publishedProfile) return publishedProfile;

  const publicProfiles = getPublicDeveloperProfiles(await listDeveloperProfiles());
  return publicProfiles.find((profile) => matchesDeveloperIdentifier(profile, slug)) || null;
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
  const normalizedSlug = normalizeSlugIdentifier(slug);
  return showcaseDeveloperProfiles
    .map(normalizeProfile)
    .find((profile) => matchesDeveloperIdentifier(profile, normalizedSlug)) || null;
}

export function getPublicDeveloperProfiles(profiles = []) {
  return mergeShowcaseProfiles(profiles).filter(isPublicDeveloperProfile);
}

export function getHomepageDeveloperProfiles(profiles = []) {
  return getPublicDeveloperProfiles(profiles).filter((profile) => profile.show_on_homepage);
}

export function findMatchingDeveloperProfile(profiles = [], developerName = "") {
  const sourceProfiles = mergeShowcaseProfiles(profiles);

  return sourceProfiles.find((profile) => matchesDeveloperIdentifier(profile, developerName)) || null;
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
