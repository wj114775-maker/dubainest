import { normalizeDeveloperQueryValue } from "@/lib/approvedDevelopers";

export function slugifyText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findApprovedDeveloper(approvedDevelopers, name) {
  const normalizedName = normalizeDeveloperQueryValue(name);
  if (!normalizedName) return null;

  const exactMatch = approvedDevelopers.find((developer) => developer.searchKey === normalizedName);
  if (exactMatch) return exactMatch;

  return approvedDevelopers.find((developer) => (
    developer.searchKey.includes(normalizedName) || normalizedName.includes(developer.searchKey)
  )) || null;
}

export function buildDeveloperDirectory(approvedDevelopers = [], listings = []) {
  const grouped = new Map();

  listings.forEach((listing) => {
    const rawName = String(listing.developer_name || "").trim();
    if (!rawName) return;

    const approvedDeveloper = findApprovedDeveloper(approvedDevelopers, rawName);
    const canonicalName = approvedDeveloper?.displayName || approvedDeveloper?.englishName || rawName;
    const slug = slugifyText(canonicalName);
    const existing = grouped.get(slug) || {
      slug,
      name: canonicalName,
      officialName: approvedDeveloper?.englishName || rawName,
      officeNumber: approvedDeveloper?.officeNumber || "",
      logoUrl: approvedDeveloper?.logoUrl || "",
      listingCount: 0,
      offPlanCount: 0,
      privateInventoryCount: 0,
      readyCount: 0,
      minPrice: null,
      maxPrice: null,
      heroImageUrl: listing.hero_image_url || "",
      areaCounts: {},
      listings: [],
    };

    existing.listingCount += 1;
    existing.offPlanCount += listing.completion_status === "off_plan" ? 1 : 0;
    existing.privateInventoryCount += listing.is_private_inventory ? 1 : 0;
    existing.readyCount += listing.completion_status === "ready" ? 1 : 0;
    existing.minPrice = existing.minPrice === null ? Number(listing.price || 0) : Math.min(existing.minPrice, Number(listing.price || 0));
    existing.maxPrice = existing.maxPrice === null ? Number(listing.price || 0) : Math.max(existing.maxPrice, Number(listing.price || 0));
    if (!existing.heroImageUrl && listing.hero_image_url) existing.heroImageUrl = listing.hero_image_url;
    if (listing.area_name) {
      existing.areaCounts[listing.area_name] = (existing.areaCounts[listing.area_name] || 0) + 1;
    }
    existing.listings.push(listing);

    grouped.set(slug, existing);
  });

  return [...grouped.values()]
    .map((developer) => ({
      ...developer,
      topAreas: Object.entries(developer.areaCounts)
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 3)
        .map(([name]) => name),
    }))
    .sort((left, right) => right.listingCount - left.listingCount || left.name.localeCompare(right.name));
}

export function getDeveloperBySlug(slug, approvedDevelopers = [], listings = []) {
  const directory = buildDeveloperDirectory(approvedDevelopers, listings);
  const direct = directory.find((developer) => developer.slug === slug);
  if (direct) return direct;

  const approvedMatch = approvedDevelopers.find((developer) => slugifyText(developer.displayName || developer.englishName) === slug);
  if (!approvedMatch) return null;

  return {
    slug,
    name: approvedMatch.displayName || approvedMatch.englishName,
    officialName: approvedMatch.englishName,
    officeNumber: approvedMatch.officeNumber || "",
    logoUrl: approvedMatch.logoUrl || "",
    listingCount: 0,
    offPlanCount: 0,
    privateInventoryCount: 0,
    readyCount: 0,
    minPrice: null,
    maxPrice: null,
    heroImageUrl: "",
    areaCounts: {},
    topAreas: [],
    listings: [],
  };
}
