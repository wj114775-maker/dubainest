import { base44 } from "@/api/base44Client";

const missingEntitySchemas = new Set();

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

export function getBase44ErrorText(error) {
  return errorText(error);
}

export function isMissingEntitySchemaError(error) {
  const status = Number(error?.status || error?.response?.status || error?.data?.status || 0);
  const message = errorText(error);
  return status === 404 && message.includes("Entity schema");
}

function markMissingEntitySchema(entityName) {
  if (entityName) {
    missingEntitySchemas.add(entityName);
  }
}

export function isEntitySchemaKnownMissing(entityName) {
  return missingEntitySchemas.has(entityName);
}

export function getMissingEntitySchemas(entityNames = []) {
  return entityNames.filter((entityName) => missingEntitySchemas.has(entityName));
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
  if (isEntitySchemaKnownMissing(entityName)) return [];
  const entity = base44.entities?.[entityName];
  if (!entity?.list) return [];
  try {
    return await entity.list(sort, limit);
  } catch (error) {
    if (isMissingEntitySchemaError(error)) {
      markMissingEntitySchema(entityName);
    }
    if (isRetryBlockedBase44Error(error)) return [];
    throw error;
  }
}

export async function filterEntitySafe(entityName, query = {}) {
  if (isEntitySchemaKnownMissing(entityName)) return [];
  const entity = base44.entities?.[entityName];
  if (!entity?.filter) return [];
  try {
    return await entity.filter(query);
  } catch (error) {
    if (isMissingEntitySchemaError(error)) {
      markMissingEntitySchema(entityName);
    }
    if (isRetryBlockedBase44Error(error)) return [];
    throw error;
  }
}

export async function createEntitySafe(entityName, payload) {
  if (isEntitySchemaKnownMissing(entityName)) {
    return { ok: false, missingSchema: true, data: null, error: null };
  }

  const entity = base44.entities?.[entityName];
  if (!entity?.create) {
    return { ok: false, missingSchema: true, data: null, error: null };
  }

  try {
    const data = await entity.create(payload);
    return { ok: true, missingSchema: false, data, error: null };
  } catch (error) {
    if (isMissingEntitySchemaError(error)) {
      markMissingEntitySchema(entityName);
      return { ok: false, missingSchema: true, data: null, error };
    }
    throw error;
  }
}

export async function updateEntitySafe(entityName, id, payload) {
  if (isEntitySchemaKnownMissing(entityName)) {
    return { ok: false, missingSchema: true, data: null, error: null };
  }

  const entity = base44.entities?.[entityName];
  if (!entity?.update) {
    return { ok: false, missingSchema: true, data: null, error: null };
  }

  try {
    const data = await entity.update(id, payload);
    return { ok: true, missingSchema: false, data, error: null };
  } catch (error) {
    if (isMissingEntitySchemaError(error)) {
      markMissingEntitySchema(entityName);
      return { ok: false, missingSchema: true, data: null, error };
    }
    throw error;
  }
}
