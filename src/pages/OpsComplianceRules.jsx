import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import AdminRecordFormCard from "@/components/admin/AdminRecordFormCard";

export default function OpsComplianceRules() {
  const queryClient = useQueryClient();
  const [ruleForm, setRuleForm] = useState({ name: "", rule_type: "publishing_gate", status: "active", conditions: "{}", actions: "{}" });

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

  const manageRule = useMutation({
    mutationFn: (payload) => base44.functions.invoke("adminManageGovernanceRecord", { entityName: "ComplianceRule", action: "create", payload, summary: "Compliance rule created", scope: "compliance" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Compliance rules" description="Define case triggers, freeze controls and SLA policy from a dedicated compliance rulebook." />
      <AccessGuard permission="compliance_rules.read">
        {rows.length ? <RegistryTableCard title="Compliance rulebook" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Type" }, { key: "status", label: "Status" }]} rows={rows} /> : <EmptyStateCard title="No compliance rules yet" description="Compliance rules will appear here once they are configured." />}
      </AccessGuard>
      <AccessGuard permission="compliance_rules.manage">
        <AdminRecordFormCard
          title="Create compliance rule"
          values={ruleForm}
          onChange={(key, value) => setRuleForm((current) => ({ ...current, [key]: value }))}
          fields={[{ key: "name", label: "Rule name" }, { key: "rule_type", label: "Rule type" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true }, { key: "actions", label: "Actions JSON", multiline: true }]}
          onSubmit={() => manageRule.mutate({ ...ruleForm, conditions: JSON.parse(ruleForm.conditions || "{}"), actions: JSON.parse(ruleForm.actions || "{}") })}
          submitLabel="Create rule"
        />
      </AccessGuard>
    </div>
  );
}