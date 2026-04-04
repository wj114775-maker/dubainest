import { base44 } from "@/api/base44Client";
import { getPropertyTypeCategory } from "@/lib/propertyTaxonomy";

const demoListings = [
  {
    id: "demo-bulgari-bay-villa",
    title: "Waterfront Bulgari Bay Villa",
    description: "A showcase six-bedroom villa concept for ultra-prime buyers who want resort privacy, marina access, and branded waterfront living on Jumeirah Bay.",
    listing_type: "private_inventory",
    property_type: "Villa",
    price: 48500000,
    bedrooms: 6,
    bathrooms: 7,
    built_up_area_sqft: 11250,
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "fresh",
    trust_band: "verified",
    trust_score: 94,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: true,
    is_private_inventory: true,
    area_name: "Jumeirah Bay",
    hero_image_url: "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-downtown-sky-residence",
    title: "Downtown Sky Residence with Burj Views",
    description: "A high-floor branded apartment concept designed for executive buyers who want prime Downtown addressability, concierge service, and iconic skyline views.",
    listing_type: "sale",
    property_type: "Apartment",
    price: 11250000,
    bedrooms: 4,
    bathrooms: 5,
    built_up_area_sqft: 3680,
    parking_spaces: 2,
    furnishing_status: "furnished",
    floor_plan_available: true,
    completion_status: "ready",
    developer_name: "Emaar",
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "fresh",
    trust_band: "verified",
    trust_score: 91,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: true,
    is_private_inventory: false,
    area_name: "Downtown Dubai",
    hero_image_url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-palm-beachfront-duplex",
    title: "Palm Jumeirah Beachfront Duplex",
    description: "A premium duplex concept for end-users who want direct beach positioning, hotel-style amenities, and a turnkey branded residence on the Palm.",
    listing_type: "sale",
    property_type: "Duplex",
    price: 19800000,
    bedrooms: 5,
    bathrooms: 6,
    built_up_area_sqft: 5440,
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "fresh",
    trust_band: "high",
    trust_score: 88,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: true,
    is_private_inventory: false,
    area_name: "Palm Jumeirah",
    hero_image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-dubai-hills-family-home",
    title: "Dubai Hills Family Villa near the Park",
    description: "A family-led villa concept blending landscaped outdoor space, school access, and a quieter lifestyle inside Dubai Hills Estate.",
    listing_type: "sale",
    property_type: "Villa",
    price: 9750000,
    bedrooms: 5,
    bathrooms: 6,
    built_up_area_sqft: 5120,
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "aging",
    trust_band: "high",
    trust_score: 84,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: true,
    is_private_inventory: false,
    area_name: "Dubai Hills Estate",
    hero_image_url: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-business-bay-canal-loft",
    title: "Business Bay Canal Loft Collection",
    description: "A design-led loft showcase built for investors and founders who want an urban address with quick Downtown access and strong resale appeal.",
    listing_type: "sale",
    property_type: "Loft",
    price: 6450000,
    bedrooms: 3,
    bathrooms: 4,
    built_up_area_sqft: 2680,
    parking_spaces: 2,
    furnishing_status: "furnished",
    floor_plan_available: true,
    completion_status: "ready",
    developer_name: "Omniyat",
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "fresh",
    trust_band: "high",
    trust_score: 82,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: false,
    is_private_inventory: false,
    area_name: "Business Bay",
    hero_image_url: "https://images.unsplash.com/photo-1600607687126-8a3414349a51?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-emirates-hills-estate",
    title: "Emirates Hills Grand Estate",
    description: "A discreet super-prime estate concept with mature landscaping, entertaining spaces, and family-office friendly positioning inside Emirates Hills.",
    listing_type: "private_inventory",
    property_type: "Estate",
    price: 72000000,
    bedrooms: 7,
    bathrooms: 9,
    built_up_area_sqft: 16500,
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "fresh",
    trust_band: "verified",
    trust_score: 96,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: true,
    is_private_inventory: true,
    area_name: "Emirates Hills",
    hero_image_url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-city-walk-penthouse",
    title: "City Walk Off-Plan Terrace Penthouse",
    description: "An off-plan penthouse showcase for buyers who want walkable retail, hospitality, and terrace-led entertaining close to the city core with future handover upside.",
    listing_type: "sale",
    property_type: "Penthouse",
    price: 13900000,
    bedrooms: 4,
    bathrooms: 5,
    built_up_area_sqft: 4310,
    parking_spaces: 3,
    furnishing_status: "unfurnished",
    floor_plan_available: true,
    completion_status: "off_plan",
    handover_label: "Q4 2028",
    developer_name: "Meraas",
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "fresh",
    trust_band: "high",
    trust_score: 87,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: true,
    is_private_inventory: false,
    area_name: "City Walk",
    hero_image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-creek-harbour-investor-suite",
    title: "Dubai Creek Harbour Off-Plan Investor Suite",
    description: "An off-plan apartment showcase positioned for buyers who care about skyline views, a newer master community, and resilient investor demand with staged payment plans.",
    listing_type: "sale",
    property_type: "Apartment",
    price: 2890000,
    bedrooms: 2,
    bathrooms: 2,
    built_up_area_sqft: 1360,
    parking_spaces: 1,
    furnishing_status: "unfurnished",
    floor_plan_available: true,
    completion_status: "off_plan",
    handover_label: "Q2 2029",
    developer_name: "Emaar",
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "aging",
    trust_band: "high",
    trust_score: 80,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: false,
    is_private_inventory: false,
    area_name: "Dubai Creek Harbour",
    hero_image_url: "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-jumeirah-golf-estates-manor",
    title: "Jumeirah Golf Estates Manor Home",
    description: "A golf-course manor showcase for buyers prioritising space, privacy, and a long-term family base within a mature villa community.",
    listing_type: "sale",
    property_type: "Villa",
    price: 21400000,
    bedrooms: 6,
    bathrooms: 8,
    built_up_area_sqft: 8840,
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "fresh",
    trust_band: "verified",
    trust_score: 90,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: true,
    is_private_inventory: false,
    area_name: "Jumeirah Golf Estates",
    hero_image_url: "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  },
  {
    id: "demo-bluewaters-branded-apartment",
    title: "Bluewaters Branded Off-Plan Corner Apartment",
    description: "A branded off-plan apartment showcase for lifestyle buyers seeking waterfront retail, skyline views, and hotel-linked amenity access on Bluewaters.",
    listing_type: "sale",
    property_type: "Apartment",
    price: 7580000,
    bedrooms: 3,
    bathrooms: 4,
    built_up_area_sqft: 2260,
    parking_spaces: 2,
    furnishing_status: "furnished",
    floor_plan_available: true,
    completion_status: "off_plan",
    handover_label: "Q1 2028",
    developer_name: "Meraas",
    status: "published",
    publication_status: "published",
    verification_status: "verified",
    freshness_status: "fresh",
    trust_band: "high",
    trust_score: 85,
    permit_verified: true,
    project_status_verified: true,
    partner_verified: true,
    broker_verified: true,
    is_private_inventory: false,
    area_name: "Bluewaters Island",
    hero_image_url: "https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1600&q=80",
    source_label: "Showcase",
    is_demo: true,
  }
];

const demoGalleryImages = {
  "demo-bulgari-bay-villa": [
    "https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-downtown-sky-residence": [
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-palm-beachfront-duplex": [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-dubai-hills-family-home": [
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-business-bay-canal-loft": [
    "https://images.unsplash.com/photo-1600607687126-8a3414349a51?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-emirates-hills-estate": [
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-city-walk-penthouse": [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-creek-harbour-investor-suite": [
    "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb3?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-jumeirah-golf-estates-manor": [
    "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1600&q=80",
  ],
  "demo-bluewaters-branded-apartment": [
    "https://images.unsplash.com/photo-1600047509782-20d39509f26d?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  ],
};

const demoListingsById = Object.fromEntries(demoListings.map((listing) => [listing.id, listing]));

function isSaleOnlyListing(listing) {
  if (!listing) return false;
  return String(listing.listing_type || "sale").toLowerCase() !== "rent";
}

function normalizeBuyerListing(listing) {
  if (!listing) return null;

  const bedrooms = Number(listing.bedrooms || 0);
  const bathrooms = Number(listing.bathrooms || bedrooms || 0);
  const parkingSpaces = listing.parking_spaces ?? listing.car_spaces ?? Math.max(Math.min(bedrooms || 1, 4), 1);
  const completionStatus = listing.completion_status || "ready";
  const description = String(listing.description || "").replace(/\bshowcase\b/gi, "listing");
  const rawGalleryImages = []
    .concat(listing.gallery_image_urls || [])
    .concat(listing.image_urls || [])
    .concat((listing.photos || []).map((item) => item?.url || item?.image_url || item))
    .concat(demoGalleryImages[listing.id] || [])
    .filter(Boolean);
  const galleryImageUrls = Array.from(new Set([listing.hero_image_url, ...rawGalleryImages].filter(Boolean)));

  return {
    purpose: "buy",
    area_unit: "sqft",
    furnishing_status: "unfurnished",
    floor_plan_available: false,
    keywords: "",
    completion_status: completionStatus,
    handover_label: completionStatus === "off_plan" ? "Future handover" : "",
    developer_name: "",
    ...listing,
    description,
    gallery_image_urls: galleryImageUrls,
    bedrooms,
    bathrooms,
    parking_spaces: parkingSpaces,
    property_category: listing.property_category || getPropertyTypeCategory(listing.property_type),
    completion_status: completionStatus,
    is_off_plan: completionStatus === "off_plan",
  };
}

async function fetchLivePublishedListings(limit = 24) {
  try {
    const listings = await base44.entities.Listing.filter({ status: "published" }, "-updated_date", limit);
    return Array.isArray(listings) ? listings.filter(isSaleOnlyListing) : [];
  } catch {
    try {
      const listings = await base44.entities.Listing.list("-updated_date", Math.max(limit, 100));
      return listings.filter((listing) => listing.status === "published" && isSaleOnlyListing(listing));
    } catch {
      return [];
    }
  }
}

function topUpWithShowcaseListings(liveListings = [], limit = 24) {
  if (!liveListings.length) {
    return demoListings.slice(0, limit);
  }

  const liveIds = new Set(liveListings.map((listing) => listing.id));
  const showcaseFill = demoListings.filter((listing) => !liveIds.has(listing.id)).slice(0, Math.max(0, limit - liveListings.length));
  return [...liveListings, ...showcaseFill].slice(0, limit);
}

export async function loadBuyerListings({ limit = 24, includeShowcase = true } = {}) {
  const liveListings = await fetchLivePublishedListings(limit);
  if (!includeShowcase) {
    return liveListings.slice(0, limit).map(normalizeBuyerListing);
  }
  return topUpWithShowcaseListings(liveListings, limit).map(normalizeBuyerListing);
}

export async function loadBuyerListingById(id) {
  if (demoListingsById[id]) {
    return normalizeBuyerListing(demoListingsById[id]);
  }

  try {
    const listing = await base44.entities.Listing.get(id);
    return isSaleOnlyListing(listing) ? normalizeBuyerListing(listing) : null;
  } catch {
    return normalizeBuyerListing(demoListingsById[id] || null);
  }
}

export function getShowcaseListings(limit = demoListings.length) {
  return demoListings.slice(0, limit).map(normalizeBuyerListing);
}

export function isShowcaseListing(listing) {
  return Boolean(listing?.is_demo);
}
