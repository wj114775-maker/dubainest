import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import GovernanceRegistryTableCard from "@/components/admin/GovernanceRegistryTableCard";
import GovernanceRuleFormCard from "@/components/admin/GovernanceRuleFormCard";

export default function OpsCommissionRules() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState(null);
  const initialValues = useMemo(() => ({ name: "", rule_scope: "global", scope_id: "global", calculation_mode: "percentage", value: "", status: "active", conditions: "{}" }), []);
  const fields = useMemo(() => ([{ key: "name", label: "Rule name" }, { key: "rule_scope", label: "Rule scope" }, { key: "scope_id", label: "Scope id" }, { key: "calculation_mode", label: "Calculation mode" }, { key: "value", label: "Value" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true, json: true }]), []);

  const { data: rows = [] } = useQuery({
    queryKey: ["ops-commission-rules"],
    queryFn: async () => {
      const rules = await base44.entities.CommissionRule.list();
      return rules.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.rule_scope,
        status: item.status || "draft",
        source: item
      }));
    },
    initialData: []
  });

  const manageRule = useMutation({
    mutationFn: ({ action, recordId, payload, summary }) => base44.functions.invoke("adminManageGovernanceRecord", { entityName: "CommissionRule", action, recordId, payload, summary, scope: "finance" }),
    onSuccess: () => {
      setEditingRule(null);
      queryClient.invalidateQueries({ queryKey: ["ops-commission-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  const submitRule = (form) => manageRule.mutate({
    action: editingRule ? "update" : "create",
    recordId: editingRule?.id,
    payload: { ...form, value: Number(form.value || 0), conditions: JSON.parse(form.conditions || "{}") },
    summary: editingRule ? "Commission rule updated" : "Commission rule created"
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Commission rules" description="Centralise commission policies so payouts and disputes trace back to explicit governed rules." />
      <AccessGuard permission="commission_rules.read">
        {rows.length ? <GovernanceRegistryTableCard title="Commission policy registry" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Scope" }, { key: "status", label: "Status" }]} rows={rows} onEdit={setEditingRule} /> : <EmptyStateCard title="No commission rules yet" description="Commission policies will appear here once they are configured." />}
      </AccessGuard>
      <AccessGuard permission="commission_rules.manage">
        <GovernanceRuleFormCard title="Create commission rule" fields={fields} initialValues={initialValues} record={editingRule} onSubmit={submitRule} submitLabel="Create rule" onCancel={() => setEditingRule(null)} />
      </AccessGuard>
    </div>
  );
}