export const PROPERTY_TYPE_GROUPS = {
  residential: [
    "Apartment",
    "Villa",
    "Townhouse",
    "Penthouse",
    "Villa Compound",
    "Hotel Apartment",
    "Land",
    "Building",
    "Floor",
  ],
  commercial: [
    "Office",
    "Shop",
    "Warehouse",
    "Showroom",
    "Commercial Villa",
    "Commercial Building",
    "Commercial Floor",
    "Factory",
    "Labour Camp",
    "Bulk Unit",
    "Industrial Land",
  ],
};

const COMMERCIAL_TYPES = new Set(PROPERTY_TYPE_GROUPS.commercial.map((item) => item.toLowerCase()));
const RESIDENTIAL_TYPES = new Set(PROPERTY_TYPE_GROUPS.residential.map((item) => item.toLowerCase()));

export function getPropertyTypeCategory(propertyType) {
  const normalized = String(propertyType || "").trim().toLowerCase();
  if (!normalized) return "residential";
  if (COMMERCIAL_TYPES.has(normalized)) return "commercial";
  if (RESIDENTIAL_TYPES.has(normalized)) return "residential";
  return "residential";
}

export function getPropertyTypeGroups() {
  return PROPERTY_TYPE_GROUPS;
}

export function getPropertyTypeOptions() {
  return Object.entries(PROPERTY_TYPE_GROUPS).flatMap(([category, items]) =>
    items.map((item) => ({
      category,
      label: item,
      value: item,
    }))
  );
}

export function getPropertyTypeLabel(category, propertyType) {
  if (propertyType && propertyType !== "all") return propertyType;
  if (category === "residential") return "Residential";
  if (category === "commercial") return "Commercial";
  return "Property type";
}
