import { useEffect } from "react";
import { buildCanonicalUrl, getSiteName } from "@/lib/seo";

function upsertMeta(attributeName, attributeValue, content) {
  if (typeof document === "undefined") return;
  const selector = `meta[${attributeName}="${attributeValue}"]`;
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function removeMeta(attributeName, attributeValue) {
  if (typeof document === "undefined") return;
  document.head.querySelector(`meta[${attributeName}="${attributeValue}"]`)?.remove();
}

function upsertLink(rel, href) {
  if (typeof document === "undefined") return;
  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function syncJsonLd(jsonLd) {
  if (typeof document === "undefined") return;
  const existing = document.head.querySelectorAll('script[data-seo-jsonld="true"]');
  existing.forEach((node) => node.remove());

  jsonLd
    .filter(Boolean)
    .forEach((item) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.dataset.seoJsonld = "true";
      script.text = JSON.stringify(item);
      document.head.appendChild(script);
    });
}

export default function SeoMeta({
  title,
  description,
  canonicalPath = "/",
  robots = "index,follow",
  image,
  jsonLd = [],
  type = "website",
}) {
  useEffect(() => {
    const siteName = getSiteName();
    const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
    const canonicalUrl = buildCanonicalUrl(canonicalPath);

    document.title = fullTitle;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", siteName);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    upsertLink("canonical", canonicalUrl);

    if (image) {
      upsertMeta("property", "og:image", image);
      upsertMeta("name", "twitter:image", image);
    } else {
      removeMeta("property", "og:image");
      removeMeta("name", "twitter:image");
    }

    syncJsonLd(Array.isArray(jsonLd) ? jsonLd : [jsonLd]);
  }, [canonicalPath, description, image, jsonLd, robots, title, type]);

  return null;
}
