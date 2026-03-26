import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";

export default function OpsComplianceRules() {
  const { data: rows = [] } = useQuery({
    queryKey: ["ops-compliance-rules"],
    queryFn: async () => {
      const rules = await base44.entities.ComplianceRule.list();
      return rules.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.rule_type,
        status: item.status || "draft"
      }));
    },
    initialData: []
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Compliance rules" description="Define case triggers, freeze controls and SLA policy from a dedicated compliance rulebook." />
      <AccessGuard permission="compliance_rules.read">
        {rows.length ? <RegistryTableCard title="Compliance rulebook" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Type" }, { key: "status", label: "Status" }]} rows={rows} /> : <EmptyStateCard title="No compliance rules yet" description="Compliance rules will appear here once they are configured." />}
      </AccessGuard>
    </div>
  );
}