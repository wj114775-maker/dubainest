import { base44 } from "@/api/base44Client";

function errorText(error) {
  return String(
    error?.message
    || error?.detail
    || error?.error
    || error?.data?.message
    || error?.data?.detail
    || ""
  );
}

export function isRetryBlockedBase44Error(error) {
  const status = Number(error?.status || error?.response?.status || error?.data?.status || 0);
  const message = errorText(error);
  return (
    status === 404
    || status === 429
    || message.includes("Entity schema")
    || message.includes("Rate limit exceeded")
  );
}

export async function listEntitySafe(entityName, sort = "-updated_date", limit = 200) {
  const entity = base44.entities?.[entityName];
  if (!entity?.list) return [];
  try {
    return await entity.list(sort, limit);
  } catch (error) {
    if (isRetryBlockedBase44Error(error)) return [];
    throw error;
  }
}

export async function filterEntitySafe(entityName, query = {}) {
  const entity = base44.entities?.[entityName];
  if (!entity?.filter) return [];
  try {
    return await entity.filter(query);
  } catch (error) {
    if (isRetryBlockedBase44Error(error)) return [];
    throw error;
  }
}
