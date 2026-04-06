import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ORIGIN = String(process.env.VITE_PUBLIC_SITE_URL || "https://dubai-nest-home.base44.app").replace(/\/$/, "");
const APP_ID = process.env.BASE44_APP_ID || "69c5253502450cc74466ea9c";
const OUTPUT_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "sitemap.xml");
const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_ROUTES = [
  "/",
  "/properties",
  "/projects",
  "/developers",
  "/areas",
  "/guides",
  "/golden-visa",
  "/quiz",
  "/sitemap",
];

function buildCanonicalUrl(pathname) {
  return new URL(pathname, `${SITE_ORIGIN}/`).toString();
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

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
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 404) {
      console.warn(`[sitemap] skipping ${entityName}: live schema not found`);
      return [];
    }

    if (!response.ok) {
      console.warn(`[sitemap] skipping ${entityName}: ${response.status} ${response.statusText}`);
      return [];
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.warn(`[sitemap] skipping ${entityName}: ${error.message}`);
    return [];
  }
}

function pickLastModified(item) {
  return String(item?.updated_date || item?.created_date || TODAY).slice(0, 10);
}

function toUrlEntry(loc, lastmod = TODAY, priority = "0.70") {
  return { loc: buildCanonicalUrl(loc), lastmod, priority };
}

async function generateSitemap() {
  const [guides, areas, listings, developerProfiles, projectProfiles] = await Promise.all([
    fetchEntity("Guide"),
    fetchEntity("Area"),
    fetchEntity("Listing"),
    fetchEntity("DeveloperProfile"),
    fetchEntity("ProjectProfile"),
  ]);

  const entries = [
    ...STATIC_ROUTES.map((route, index) => toUrlEntry(route, TODAY, index === 0 ? "1.00" : "0.80")),
    ...guides
      .filter((guide) => guide.status === "published" && guide.slug)
      .map((guide) => toUrlEntry(`/guides/${guide.slug}`, pickLastModified(guide), "0.72")),
    ...areas
      .filter((area) => area.slug)
      .map((area) => toUrlEntry(`/areas/${area.slug}`, pickLastModified(area), "0.72")),
    ...listings
      .filter((listing) => listing.status === "published" || listing.publication_status === "published")
      .map((listing) => toUrlEntry(buildListingPath(listing), pickLastModified(listing), "0.64")),
    ...developerProfiles
      .filter((profile) => profile.page_status === "published" && profile.partnership_status === "partnered" && profile.slug)
      .map((profile) => toUrlEntry(`/developers/${profile.slug}`, pickLastModified(profile), "0.76")),
    ...projectProfiles
      .filter((profile) => profile.page_status === "published" && profile.slug)
      .map((profile) => toUrlEntry(`/projects/${profile.slug}`, pickLastModified(profile), "0.76")),
  ];

  const uniqueEntries = Array.from(
    new Map(entries.map((entry) => [entry.loc, entry])).values()
  ).sort((left, right) => left.loc.localeCompare(right.loc));

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueEntries.map((entry) => [
      "  <url>",
      `    <loc>${escapeXml(entry.loc)}</loc>`,
      `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`,
      `    <priority>${escapeXml(entry.priority)}</priority>`,
      "  </url>",
    ].join("\n")),
    "</urlset>",
    "",
  ].join("\n");

  await fs.writeFile(OUTPUT_PATH, xml, "utf8");
  console.log(`[sitemap] wrote ${uniqueEntries.length} URLs to ${OUTPUT_PATH}`);
}

await generateSitemap();
