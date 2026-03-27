import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import ComplianceQueue from "@/components/ops/ComplianceQueue";
import ComplianceCaseCard from "@/components/ops/ComplianceCaseCard";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminRecordFormCard from "@/components/admin/AdminRecordFormCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OpsCompliance() {
  const queryClient = useQueryClient();
  const [caseForm, setCaseForm] = useState({ summary: "", category: "permit", severity: "low", status: "open" });
  const [ruleForm, setRuleForm] = useState({ name: "", rule_type: "publishing_gate", status: "active", conditions: "{}", actions: "{}" });

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

  const manageRecord = useMutation({
    mutationFn: ({ entityName, payload, summary }) => base44.functions.invoke("adminManageGovernanceRecord", { entityName, action: "create", payload, summary, scope: "compliance" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-cases"] });
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

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
      <AccessGuard permission="compliance_cases.manage">
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminRecordFormCard
            title="Create compliance case"
            values={caseForm}
            onChange={(key, value) => setCaseForm((current) => ({ ...current, [key]: value }))}
            fields={[{ key: "summary", label: "Summary", multiline: true }, { key: "category", label: "Category" }, { key: "severity", label: "Severity" }, { key: "status", label: "Status" }]}
            onSubmit={() => manageRecord.mutate({ entityName: "ComplianceCase", payload: caseForm, summary: "Compliance case created" })}
            submitLabel="Create case"
          />
          <AdminRecordFormCard
            title="Create compliance rule"
            values={ruleForm}
            onChange={(key, value) => setRuleForm((current) => ({ ...current, [key]: value }))}
            fields={[{ key: "name", label: "Rule name" }, { key: "rule_type", label: "Rule type" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true }, { key: "actions", label: "Actions JSON", multiline: true }]}
            onSubmit={() => manageRecord.mutate({ entityName: "ComplianceRule", payload: { ...ruleForm, conditions: JSON.parse(ruleForm.conditions || "{}"), actions: JSON.parse(ruleForm.actions || "{}") }, summary: "Compliance rule created" })}
            submitLabel="Create rule"
          />
        </div>
      </AccessGuard>
    </div>
  );
}