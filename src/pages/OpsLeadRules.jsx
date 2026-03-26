import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import GovernanceRegistryTableCard from "@/components/admin/GovernanceRegistryTableCard";
import GovernanceRuleFormCard from "@/components/admin/GovernanceRuleFormCard";

export default function OpsLeadRules() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState(null);
  const initialValues = useMemo(() => ({ name: "", rule_type: "ownership_lock", priority: "1", status: "active", conditions: "{}", actions: "{}" }), []);
  const fields = useMemo(() => ([{ key: "name", label: "Rule name" }, { key: "rule_type", label: "Rule type" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true, json: true }, { key: "actions", label: "Actions JSON", multiline: true, json: true }]), []);

  const { data: rows = [] } = useQuery({
    queryKey: ["ops-lead-rules"],
    queryFn: async () => {
      const rules = await base44.entities.LeadProtectionRule.list();
      return rules.map((item) => ({
        id: item.id,
        name: item.name || "Untitled rule",
        code: item.rule_type || "lead_policy",
        status: item.status || "draft",
        source: item
      }));
    },
    initialData: []
  });

  const manageRule = useMutation({
    mutationFn: ({ action, recordId, payload, summary }) => base44.functions.invoke("adminManageGovernanceRecord", { entityName: "LeadProtectionRule", action, recordId, payload, summary, scope: "lead" }),
    onSuccess: () => {
      setEditingRule(null);
      queryClient.invalidateQueries({ queryKey: ["ops-lead-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  const submitRule = (form) => manageRule.mutate({
    action: editingRule ? "update" : "create",
    recordId: editingRule?.id,
    payload: { ...form, priority: Number(form.priority || 0), conditions: JSON.parse(form.conditions || "{}"), actions: JSON.parse(form.actions || "{}") },
    summary: editingRule ? "Lead protection rule updated" : "Lead protection rule created"
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Lead protection rules" description="Move ownership, attribution and payout logic into a central event-driven governance layer." />
      <AccessGuard permission="assignments.read">
        {rows.length ? <GovernanceRegistryTableCard title="Lead protection engine" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Type" }, { key: "status", label: "Status" }]} rows={rows} onEdit={setEditingRule} /> : <EmptyStateCard title="No lead rules yet" description="Lead protection rules will appear here once they are added." />}
      </AccessGuard>
      <AccessGuard permission="assignments.manage">
        <GovernanceRuleFormCard title="Create lead protection rule" fields={fields} initialValues={initialValues} record={editingRule} onSubmit={submitRule} submitLabel="Create rule" onCancel={() => setEditingRule(null)} />
      </AccessGuard>
    </div>
  );
}