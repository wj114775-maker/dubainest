import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { showcaseListingSeoEntries } from "../src/data/showcaseSeoCatalog.js";

const SITE_ORIGIN = String(process.env.VITE_PUBLIC_SITE_URL || "https://dubai-nest-home.base44.app").replace(/\/$/, "");
const APP_ID = process.env.BASE44_APP_ID || "69c5253502450cc74466ea9c";
const OUTPUT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "route-manifest.json");

const STATIC_ROUTES = [
  "/",
  "/properties",
  "/projects",
  "/developers",
  "/areas",
  "/guides",
  "/about",
  "/contact",
  "/golden-visa",
  "/off-plan",
  "/private-inventory",
  "/privacy",
  "/buyer-qualification",
  "/sitemap",
  "/terms",
];

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildListingPath(listing) {
  const slug = String(listing.slug || "").trim() || slugify(listing.title || listing.property_type || "property");
  return `/properties/${slug}--${listing.id}`;
}

async function fetchEntity(entityName) {
  const url = `${SITE_ORIGIN}/api/apps/${APP_ID}/entities/${entityName}`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (response.status === 404) {
      console.warn(`[route-manifest] skipping ${entityName}: live schema not found`);
      return [];
    }

    if (!response.ok) {
      console.warn(`[route-manifest] skipping ${entityName}: ${response.status} ${response.statusText}`);
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.warn(`[route-manifest] skipping ${entityName}: ${error.message}`);
    return [];
  }
}

async function generateRouteManifest() {
  const [guides, areas, listings, developerProfiles, projectProfiles] = await Promise.all([
    fetchEntity("Guide"),
    fetchEntity("Area"),
    fetchEntity("Listing"),
    fetchEntity("DeveloperProfile"),
    fetchEntity("ProjectProfile"),
  ]);

  const manifest = {
    generatedAt: new Date().toISOString(),
    siteOrigin: SITE_ORIGIN,
    routes: Array.from(new Set([
      ...STATIC_ROUTES,
      ...guides.filter((guide) => guide.status === "published" && guide.slug).map((guide) => `/guides/${guide.slug}`),
      ...areas.filter((area) => area.slug).map((area) => `/areas/${area.slug}`),
      ...listings
        .filter((listing) => listing.status === "published" || listing.publication_status === "published")
        .map((listing) => buildListingPath(listing)),
      ...(!listings.some((listing) => listing.status === "published" || listing.publication_status === "published")
        ? showcaseListingSeoEntries.map((listing) => listing.path)
        : []),
      ...developerProfiles
        .filter((profile) => profile.page_status === "published" && profile.partnership_status === "partnered" && profile.slug)
        .map((profile) => `/developers/${profile.slug}`),
      ...projectProfiles
        .filter((profile) => profile.page_status === "published" && profile.slug)
        .map((profile) => `/projects/${profile.slug}`),
    ])).sort(),
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`[route-manifest] wrote ${manifest.routes.length} routes to ${OUTPUT_PATH}`);
}

await generateRouteManifest();
