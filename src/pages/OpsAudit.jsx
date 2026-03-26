import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AuditFeedCard from "@/components/admin/AuditFeedCard";
import AccessGuard from "@/components/admin/AccessGuard";

export default function OpsAudit() {
  const { data: entries = [] } = useQuery({
    queryKey: ["ops-audit-feed"],
    queryFn: async () => base44.entities.AuditLog.list("-created_date", 100),
    initialData: []
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Audit" title="Immutable event history across leads, payouts and controls" description="Audit visibility is core to enterprise trust, investigation and partner governance." />
      <AccessGuard permission="audit.read">
        <AuditFeedCard entries={entries} />
      </AccessGuard>
    </div>
  );
}