const STORAGE_KEY = "dubainest_property_search_locations_v1";

function normalizeLocation(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function readRawStore() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRawStore(store) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore localStorage write failures and continue with the page experience.
  }
}

export function recordPropertySearchLocation(location) {
  const normalized = normalizeLocation(location);
  if (!normalized) return;

  const key = normalized.toLowerCase();
  const store = readRawStore();
  const current = store[key] || { label: normalized, count: 0 };

  store[key] = {
    label: current.label || normalized,
    count: Number(current.count || 0) + 1,
  };

  writeRawStore(store);
}

export function readPropertySearchLocations(fallbackLocations = [], limit = 4) {
  const store = readRawStore();
  const ranked = Object.values(store)
    .filter((item) => item?.label)
    .sort((left, right) => Number(right.count || 0) - Number(left.count || 0))
    .map((item) => normalizeLocation(item.label));

  const merged = [...ranked, ...fallbackLocations.map(normalizeLocation)].filter(Boolean);
  return [...new Set(merged)].slice(0, limit);
}
