export const DEMO_DEVELOPER_SLUG = "meraas";
export const DEMO_PROJECT_SLUG = "city-walk-crestlane";

function findApprovedDeveloper(approvedDevelopers = [], developerName = "") {
  const term = String(developerName || "").trim().toLowerCase();
  if (!term) return null;
  return approvedDevelopers.find((developer) => (
    String(developer.englishName || "").toLowerCase().includes(term)
    || String(developer.displayName || "").toLowerCase().includes(term)
  )) || null;
}

export function buildDemoDeveloperProfileTemplate(approvedDevelopers = []) {
  const official = findApprovedDeveloper(approvedDevelopers, "Meraas");

  return {
    developer_name: "Meraas",
    approved_developer_name: official?.englishName || "Meraas",
    office_number: official?.officeNumber || "",
    slug: DEMO_DEVELOPER_SLUG,
    partnership_status: "partnered",
    page_status: "published",
    show_on_homepage: true,
    headline: "Partnered Dubai developer page template for flagship lifestyle-led projects",
    summary: "A controlled public developer page for Meraas with linked project launches, active sale stock, and curated area positioning across City Walk, Bluewaters, and waterfront communities.",
    body: "Use this page as the enterprise template for partnered developer profiles. It keeps the public layer clean: one controlled brand story, linked project pages, and relevant live listings without exposing every operational record. The page is designed to move buyers from developer trust into project context and then into unit-level discovery.",
    hero_image_url: "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2200&q=80",
    logo_url: official?.logoUrl || "",
    primary_city: "Dubai",
    featured_areas: ["City Walk", "Bluewaters Island", "Jumeirah Bay"],
    brand_color: "#0f172a",
    contact_email: "developers@dubaisphere.com",
    contact_phone: "",
    notes: "Starter developer profile generated from the Ops Content quick-start set.",
  };
}

export function buildDemoProjectProfileTemplate() {
  return {
    project_id: "",
    project_name: "City Walk Crestlane",
    slug: DEMO_PROJECT_SLUG,
    developer_profile_slug: DEMO_DEVELOPER_SLUG,
    developer_name: "Meraas",
    page_status: "published",
    show_on_homepage: true,
    primary_city: "Dubai",
    area_name: "City Walk",
    project_status_override: "under_construction",
    handover_label_override: "Q4 2028",
    starting_price_override: 2750000,
    headline: "A governed off-plan project page template for launch-led buyer journeys",
    summary: "City Walk Crestlane is a polished project-page template designed to sit between the developer page and individual listings, with launch positioning, handover timing, payment-plan language, and linked stock.",
    body: "This project page demonstrates the enterprise project-profile layer. It is governed separately from the raw project entity, so the public site only shows launches and developments you deliberately publish. Use it for launch narrative, handover, payment-plan summaries, amenities, brochure routing, and linked inventory discovery.",
    hero_image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2200&q=80",
    gallery_image_urls: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2200&q=80",
      "https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=2200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=2200&q=80",
    ],
    brochure_url: "",
    floor_plan_url: "",
    payment_plan_summary: "20% on booking, 30% during construction, and 50% on handover. Update this summary in the page manager when the live launch pack is confirmed.",
    unit_types: ["Apartment", "Penthouse"],
    bedroom_range: "1-4",
    amenity_highlights: ["Resort pool", "Wellness club", "Private lounges", "Retail promenade"],
    featured_listing_ids: ["demo-city-walk-penthouse"],
    contact_email: "projects@dubaisphere.com",
    contact_phone: "",
    seo_title: "City Walk Crestlane Dubai Off-Plan Project",
    seo_description: "Review City Walk Crestlane in Dubai with launch positioning, handover timing, payment-plan summary, and linked sale opportunities.",
    notes: "Starter project profile generated from the Ops Content quick-start set.",
  };
}
