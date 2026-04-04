import { appParams } from "@/lib/app-params";
import { defaultAppConfig } from "@/lib/appShell";

const DEFAULT_SITE_ORIGIN = "https://dubai-nest-home.base44.app";

export function getSiteOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  return String(
    import.meta.env.VITE_PUBLIC_SITE_URL
    || appParams.appBaseUrl
    || DEFAULT_SITE_ORIGIN
  ).replace(/\/$/, "");
}

export function getSiteName() {
  return defaultAppConfig.app_name;
}

export function buildCanonicalUrl(path = "/") {
  return new URL(path, `${getSiteOrigin()}/`).toString();
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

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: getSiteName(),
    url: getSiteOrigin(),
  };
}
