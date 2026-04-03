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
      <SectionHeading eyebrow="Risk and quality" title="Audit log across buyers, supply, money, and control actions" description="Use this page to review the event trail after the fact. It is a review layer, not a daily pipeline workspace." />
      <AccessGuard permission="audit.read">
        <div className="space-y-6">
          <AdminSummaryStrip items={summary} />
          <AuditFeedCard entries={entries} />
        </div>
      </AccessGuard>
    </div>
  );
}
