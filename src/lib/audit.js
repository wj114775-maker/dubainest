import { base44 } from "@/api/base44Client";

export async function createAuditEntry(entry) {
  return base44.entities.AuditLog.create({
    immutable: true,
    ...entry
  });
}