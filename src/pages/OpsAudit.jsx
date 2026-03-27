import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AuditFeedCard from "@/components/admin/AuditFeedCard";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";

export default function OpsAudit() {
  const { data: entries = [] } = useQuery({
    queryKey: ["ops-audit-feed"],
    queryFn: async () => base44.entities.AuditLog.list("-created_date", 100),
    initialData: []
  });

  const summary = [
    { label: "Entries", value: String(entries.length) },
    { label: "Lead scope", value: String(entries.filter((item) => item.scope === "lead").length) },
    { label: "Security scope", value: String(entries.filter((item) => item.scope === "security").length) },
    { label: "Immutable", value: String(entries.filter((item) => item.immutable !== false).length) }
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Audit" title="Immutable event history across leads, payouts and controls" description="Audit visibility is core to enterprise trust, investigation and partner governance." />
      <AccessGuard permission="audit.read">
        <div className="space-y-6">
          <AdminSummaryStrip items={summary} />
          <AuditFeedCard entries={entries} />
        </div>
      </AccessGuard>
    </div>
  );
}