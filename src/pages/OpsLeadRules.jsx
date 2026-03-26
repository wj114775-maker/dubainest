import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";

export default function OpsLeadRules() {
  const { data: rows = [] } = useQuery({
    queryKey: ["ops-lead-rules"],
    queryFn: async () => {
      const rules = await base44.entities.LeadProtectionRule.list();
      return rules.map((item) => ({
        id: item.id,
        name: item.name || item.code || "Untitled rule",
        code: item.rule_type || item.code || "lead_policy",
        status: item.status || "draft"
      }));
    },
    initialData: []
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Lead protection rules" description="Move ownership, attribution and payout logic into a central event-driven governance layer." />
      <AccessGuard permission="assignments.read">
        {rows.length ? <RegistryTableCard title="Lead protection engine" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Type" }, { key: "status", label: "Status" }]} rows={rows} /> : <EmptyStateCard title="No lead rules yet" description="Lead protection rules will appear here once they are added." />}
      </AccessGuard>
    </div>
  );
}