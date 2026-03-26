import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import AdminRecordFormCard from "@/components/admin/AdminRecordFormCard";

export default function OpsLeadRules() {
  const queryClient = useQueryClient();
  const [ruleForm, setRuleForm] = useState({ name: "", rule_type: "ownership_lock", priority: "1", status: "active", conditions: "{}", actions: "{}" });

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

  const manageRule = useMutation({
    mutationFn: (payload) => base44.functions.invoke("adminManageGovernanceRecord", { entityName: "LeadProtectionRule", action: "create", payload, summary: "Lead protection rule created", scope: "lead" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-lead-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Lead protection rules" description="Move ownership, attribution and payout logic into a central event-driven governance layer." />
      <AccessGuard permission="assignments.read">
        {rows.length ? <RegistryTableCard title="Lead protection engine" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Type" }, { key: "status", label: "Status" }]} rows={rows} /> : <EmptyStateCard title="No lead rules yet" description="Lead protection rules will appear here once they are added." />}
      </AccessGuard>
      <AccessGuard permission="assignments.manage">
        <AdminRecordFormCard
          title="Create lead protection rule"
          values={ruleForm}
          onChange={(key, value) => setRuleForm((current) => ({ ...current, [key]: value }))}
          fields={[{ key: "name", label: "Rule name" }, { key: "rule_type", label: "Rule type" }, { key: "priority", label: "Priority" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true }, { key: "actions", label: "Actions JSON", multiline: true }]}
          onSubmit={() => manageRule.mutate({ ...ruleForm, priority: Number(ruleForm.priority || 0), conditions: JSON.parse(ruleForm.conditions || "{}"), actions: JSON.parse(ruleForm.actions || "{}") })}
          submitLabel="Create rule"
        />
      </AccessGuard>
    </div>
  );
}