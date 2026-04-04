import fallbackPayload from "@/data/approvedDevelopers.generated.json";

const CACHE_KEY = "dubainest.approvedDevelopers.v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const OFFICIAL_URL = fallbackPayload.official_url;

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function simplifyDeveloperName(name) {
  return clean(name)
    .toLowerCase()
    .replace(/[.,/\\|()-]/g, " ")
    .replace(/\b(real estate|property|properties|development|developments|developer|developers|holding|holdings|investment|investments|group|company|co|ltd|limited|pjsc|pjsc|llc|l l c|s o c|soc)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function displayName(name) {
  const cleaned = clean(name);
  return cleaned.replace(/\s+(L\.L\.C(?:\s*S\.O\.C)?|LLC(?:\s*S\.O\.C)?|P\.?J\.?S\.?C\.?|PJSC|LTD|LIMITED)\b.*$/i, "").trim() || cleaned;
}

function normalizeDeveloperRecord(record) {
  const englishName = clean(record.english_name || record.englishName || record.name?.englishName);
  const arabicName = clean(record.arabic_name || record.arabicName || record.name?.arabicName);
  const officeNumber = clean(record.office_number || record.officeNumber || record.number);
  const email = clean(record.email || record.contact?.email);
  const phoneNumber = clean(record.phone_number || record.phoneNumber || record.contact?.phone || record.contact?.mobile);
  const logoUrl = clean(record.logo_url || record.logo?.thumbnailUrl || record.logo?.mediaUrl);
  const searchKey = simplifyDeveloperName(englishName);

  return {
    id: officeNumber || englishName,
    value: englishName,
    officeNumber,
    englishName,
    arabicName,
    email,
    phoneNumber,
    logoUrl,
    displayName: displayName(englishName),
    searchKey,
  };
}

function mergeDevelopers(records) {
  const merged = new Map();

  for (const record of records) {
    const normalized = normalizeDeveloperRecord(record);
    const key = normalized.officeNumber || normalized.englishName.toLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, normalized);
      continue;
    }

    merged.set(key, {
      ...existing,
      ...Object.fromEntries(Object.entries(normalized).filter(([, value]) => value)),
    });
  }

  return [...merged.values()].sort((left, right) => left.englishName.localeCompare(right.englishName));
}

function readCachedDevelopers() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.fetched_at || !Array.isArray(parsed?.developers)) return null;
    if (Date.now() - parsed.fetched_at > CACHE_TTL_MS) return null;
    return parsed.developers;
  } catch {
    return null;
  }
}

function writeCachedDevelopers(developers) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({
      fetched_at: Date.now(),
      developers,
    }));
  } catch {
    // ignore storage failures
  }
}

async function fetchOfficialDevelopers() {
  const response = await fetch(OFFICIAL_URL, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Developer feed failed with ${response.status}`);
  }

  const payload = await response.json();
  const developers = payload?.response?.developers || [];
  return developers.map((item) => ({
    office_number: item.number,
    english_name: item.name?.englishName,
    arabic_name: item.name?.arabicName,
    email: item.contact?.email,
    phone_number: item.contact?.phone || item.contact?.mobile,
    logo_url: item.logo?.thumbnailUrl || item.logo?.mediaUrl,
  }));
}

export function getFallbackApprovedDevelopers() {
  return mergeDevelopers(fallbackPayload.developers || []);
}

export async function loadApprovedDevelopers({ forceRefresh = false } = {}) {
  const fallback = getFallbackApprovedDevelopers();
  if (!forceRefresh) {
    const cached = readCachedDevelopers();
    if (cached?.length) return cached;
  }

  try {
    const official = await fetchOfficialDevelopers();
    const merged = mergeDevelopers([...fallback, ...official]);
    writeCachedDevelopers(merged);
    return merged;
  } catch {
    return fallback;
  }
}

export function normalizeDeveloperQueryValue(value) {
  return simplifyDeveloperName(value);
}
