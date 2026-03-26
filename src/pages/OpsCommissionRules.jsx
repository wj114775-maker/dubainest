import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";

export default function OpsCommissionRules() {
  const { data: rows = [] } = useQuery({
    queryKey: ["ops-commission-rules"],
    queryFn: async () => {
      const rules = await base44.entities.CommissionRule.list();
      return rules.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.rule_scope,
        status: item.status || "draft"
      }));
    },
    initialData: []
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Commission rules" description="Centralise commission policies so payouts and disputes trace back to explicit governed rules." />
      <AccessGuard permission="commission_rules.read">
        {rows.length ? <RegistryTableCard title="Commission policy registry" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Scope" }, { key: "status", label: "Status" }]} rows={rows} /> : <EmptyStateCard title="No commission rules yet" description="Commission policies will appear here once they are configured." />}
      </AccessGuard>
    </div>
  );
}