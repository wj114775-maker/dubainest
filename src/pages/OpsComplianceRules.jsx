import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import GovernanceRegistryTableCard from "@/components/admin/GovernanceRegistryTableCard";
import GovernanceRuleFormCard from "@/components/admin/GovernanceRuleFormCard";

export default function OpsComplianceRules() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState(null);
  const initialValues = useMemo(() => ({ name: "", rule_type: "publishing_gate", status: "active", conditions: "{}", actions: "{}" }), []);
  const fields = useMemo(() => ([{ key: "name", label: "Rule name" }, { key: "rule_type", label: "Rule type" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true, json: true }, { key: "actions", label: "Actions JSON", multiline: true, json: true }]), []);

  const { data: rows = [] } = useQuery({
    queryKey: ["ops-compliance-rules"],
    queryFn: async () => {
      const rules = await base44.entities.ComplianceRule.list();
      return rules.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.rule_type,
        status: item.status || "draft",
        source: item
      }));
    },
    initialData: []
  });

  const manageRule = useMutation({
    mutationFn: ({ action, recordId, payload, summary }) => base44.functions.invoke("adminManageGovernanceRecord", { entityName: "ComplianceRule", action, recordId, payload, summary, scope: "compliance" }),
    onSuccess: () => {
      setEditingRule(null);
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  const submitRule = (form) => manageRule.mutate({
    action: editingRule ? "update" : "create",
    recordId: editingRule?.id,
    payload: { ...form, conditions: JSON.parse(form.conditions || "{}"), actions: JSON.parse(form.actions || "{}") },
    summary: editingRule ? "Compliance rule updated" : "Compliance rule created"
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Compliance rules" description="Define case triggers, freeze controls and SLA policy from a dedicated compliance rulebook." />
      <AccessGuard permission="compliance_rules.read">
        {rows.length ? <GovernanceRegistryTableCard title="Compliance rulebook" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Type" }, { key: "status", label: "Status" }]} rows={rows} onEdit={setEditingRule} /> : <EmptyStateCard title="No compliance rules yet" description="Compliance rules will appear here once they are configured." />}
      </AccessGuard>
      <AccessGuard permission="compliance_rules.manage">
        <GovernanceRuleFormCard title="Create compliance rule" fields={fields} initialValues={initialValues} record={editingRule} onSubmit={submitRule} submitLabel="Create rule" onCancel={() => setEditingRule(null)} />
      </AccessGuard>
    </div>
  );
}