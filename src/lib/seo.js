import { appParams } from "@/lib/app-params";
import { defaultAppConfig } from "@/lib/appShell";

const DEFAULT_SITE_ORIGIN = "https://dubai-nest-home.base44.app";
const DEFAULT_SOCIAL_IMAGE_PATH = "/logo_v2.svg";

export function getCanonicalOrigin() {
  return String(
    import.meta.env.VITE_PUBLIC_SITE_URL
    || DEFAULT_SITE_ORIGIN
  ).replace(/\/$/, "");
}

export function getRuntimeOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return getCanonicalOrigin();
}

export function getSiteOrigin() {
  return getCanonicalOrigin();
}

export function getSiteName() {
  return defaultAppConfig.app_name;
}

export function buildCanonicalUrl(path = "/") {
  return new URL(path, `${getCanonicalOrigin()}/`).toString();
}

export function isIndexableOrigin(origin = getRuntimeOrigin()) {
  return origin === getCanonicalOrigin();
}

export function getEffectiveRobots(robots = "index,follow") {
  return isIndexableOrigin() ? robots : "noindex,nofollow";
}

export function getDefaultSocialImage() {
  return buildCanonicalUrl(DEFAULT_SOCIAL_IMAGE_PATH);
}

export function truncateSeoDescription(text, maxLength = 160) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function buildBreadcrumbJsonLd(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildCanonicalUrl(item.path),
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: getSiteName(),
    url: getSiteOrigin(),
    logo: `${getSiteOrigin()}/logo_v2.svg`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: defaultAppConfig.support_email,
        telephone: defaultAppConfig.whatsapp_number,
        areaServed: "AE",
        availableLanguage: ["en"],
      },
    ],
  };
}

export function buildRealEstateAgentJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: getSiteName(),
    url: getSiteOrigin(),
    image: getDefaultSocialImage(),
    email: defaultAppConfig.support_email,
    telephone: defaultAppConfig.whatsapp_number,
    areaServed: "Dubai, UAE",
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: getSiteName(),
    url: getSiteOrigin(),
    potentialAction: {
      "@type": "SearchAction",
      target: `${buildCanonicalUrl("/properties")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildArticleJsonLd({
  headline,
  description,
  path,
  datePublished,
  dateModified,
  image,
  section,
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    image: image ? [image] : [getDefaultSocialImage()],
    datePublished,
    dateModified: dateModified || datePublished,
    articleSection: section,
    mainEntityOfPage: buildCanonicalUrl(path),
    author: {
      "@type": "Organization",
      name: getSiteName(),
    },
    publisher: {
      "@type": "Organization",
      name: getSiteName(),
      logo: {
        "@type": "ImageObject",
        url: getDefaultSocialImage(),
      },
    },
  };
}
