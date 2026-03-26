import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import ComplianceQueue from "@/components/ops/ComplianceQueue";
import ComplianceCaseCard from "@/components/ops/ComplianceCaseCard";
import AccessGuard from "@/components/admin/AccessGuard";

export default function OpsCompliance() {
  const { data: cases = [] } = useQuery({
    queryKey: ["ops-compliance-cases"],
    queryFn: () => base44.entities.ComplianceCase.list(),
    initialData: []
  });

  const queueItems = cases.map((item) => ({
    id: item.id,
    summary: item.summary,
    category: item.category,
    status: item.status,
    severity: item.severity
  }));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Compliance" title="Verification, permit and publishing controls" description="Compliance teams control what can go live, what is flagged, and what needs evidence before partner execution continues." />
      <AccessGuard permission="compliance_cases.read">
        <ComplianceQueue items={queueItems} />
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        <div className="grid gap-4 md:grid-cols-2">
          {cases.map((item) => <ComplianceCaseCard key={item.id} item={item} />)}
        </div>
      </AccessGuard>
    </div>
  );
}