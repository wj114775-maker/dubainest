import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import AdminRecordFormCard from "@/components/admin/AdminRecordFormCard";

export default function OpsCommissionRules() {
  const queryClient = useQueryClient();
  const [ruleForm, setRuleForm] = useState({ name: "", rule_scope: "global", scope_id: "global", calculation_mode: "percentage", value: "", status: "active", conditions: "{}" });

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

  const manageRule = useMutation({
    mutationFn: (payload) => base44.functions.invoke("adminManageGovernanceRecord", { entityName: "CommissionRule", action: "create", payload, summary: "Commission rule created", scope: "finance" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-commission-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Commission rules" description="Centralise commission policies so payouts and disputes trace back to explicit governed rules." />
      <AccessGuard permission="commission_rules.read">
        {rows.length ? <RegistryTableCard title="Commission policy registry" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Scope" }, { key: "status", label: "Status" }]} rows={rows} /> : <EmptyStateCard title="No commission rules yet" description="Commission policies will appear here once they are configured." />}
      </AccessGuard>
      <AccessGuard permission="commission_rules.manage">
        <AdminRecordFormCard
          title="Create commission rule"
          values={ruleForm}
          onChange={(key, value) => setRuleForm((current) => ({ ...current, [key]: value }))}
          fields={[{ key: "name", label: "Rule name" }, { key: "rule_scope", label: "Rule scope" }, { key: "scope_id", label: "Scope id" }, { key: "calculation_mode", label: "Calculation mode" }, { key: "value", label: "Value" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true }]}
          onSubmit={() => manageRule.mutate({ ...ruleForm, value: Number(ruleForm.value || 0), conditions: JSON.parse(ruleForm.conditions || "{}") })}
          submitLabel="Create rule"
        />
      </AccessGuard>
    </div>
  );
}