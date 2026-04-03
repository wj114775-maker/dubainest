import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import GovernanceRegistryTableCard from "@/components/admin/GovernanceRegistryTableCard";
import GovernanceRuleFormCard from "@/components/admin/GovernanceRuleFormCard";

const parseBoolean = (value) => String(value).toLowerCase() === "true";

export default function OpsCommissionRules() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState(null);

  const initialValues = useMemo(() => ({
    name: "",
    rule_code: "",
    trigger_type: "manual",
    fee_type: "flat_referral_fee",
    calculation_method: "flat_amount",
    currency: "AED",
    percentage_rate: "",
    flat_amount: "",
    minimum_amount: "",
    maximum_amount: "",
    partner_id: "",
    project_id: "",
    listing_type: "",
    lead_type: "",
    buyer_type: "",
    private_inventory_only: "false",
    high_value_only: "false",
    priority: "0",
    status: "active",
    effective_from: "",
    effective_to: "",
    conditions_json: "{}"
  }), []);

  const fields = useMemo(() => ([
    { key: "name", label: "Rule name" },
    { key: "rule_code", label: "Rule code" },
    { key: "trigger_type", label: "Trigger type" },
    { key: "fee_type", label: "Fee type" },
    { key: "calculation_method", label: "Calculation method" },
    { key: "currency", label: "Currency" },
    { key: "percentage_rate", label: "Percentage rate" },
    { key: "flat_amount", label: "Flat amount" },
    { key: "minimum_amount", label: "Minimum amount" },
    { key: "maximum_amount", label: "Maximum amount" },
    { key: "partner_id", label: "Partner id" },
    { key: "project_id", label: "Project id" },
    { key: "listing_type", label: "Listing type" },
    { key: "lead_type", label: "Lead type" },
    { key: "buyer_type", label: "Buyer type" },
    { key: "private_inventory_only", label: "Private inventory only (true/false)" },
    { key: "high_value_only", label: "High value only (true/false)" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status" },
    { key: "effective_from", label: "Effective from (ISO date)" },
    { key: "effective_to", label: "Effective to (ISO date)" },
    { key: "conditions_json", label: "Conditions JSON", multiline: true, json: true }
  ]), []);

  const { data: rows = [] } = useQuery({
    queryKey: ["ops-commission-rules"],
    queryFn: async () => {
      const rules = await base44.entities.CommissionRule.list("-updated_date", 200);
      return rules.map((item) => ({
        id: item.id,
        name: item.name,
        rule_code: item.rule_code || item.id,
        trigger_type: item.trigger_type || "manual",
        fee_type: item.fee_type || "flat_referral_fee",
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
      queryClient.invalidateQueries({ queryKey: ["ops-revenue-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  const submitRule = (form) => manageRule.mutate({
    action: editingRule ? "update" : "create",
    recordId: editingRule?.id,
    payload: {
      ...form,
      percentage_rate: form.percentage_rate ? Number(form.percentage_rate) : undefined,
      flat_amount: form.flat_amount ? Number(form.flat_amount) : undefined,
      minimum_amount: form.minimum_amount ? Number(form.minimum_amount) : undefined,
      maximum_amount: form.maximum_amount ? Number(form.maximum_amount) : undefined,
      priority: Number(form.priority || 0),
      private_inventory_only: parseBoolean(form.private_inventory_only),
      high_value_only: parseBoolean(form.high_value_only),
      conditions_json: JSON.parse(form.conditions_json || "{}")
    },
    summary: editingRule ? "Commission rule updated" : "Commission rule created"
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Commission rules" description="Define the trigger, fee basis, rule priority, and eligibility conditions that drive revenue entitlements." />
      <AccessGuard permission="commission_rules.read">
        {rows.length ? (
          <GovernanceRegistryTableCard
            title="Commission policy registry"
            columns={[
              { key: "name", label: "Rule" },
              { key: "rule_code", label: "Code" },
              { key: "trigger_type", label: "Trigger" },
              { key: "fee_type", label: "Fee model" },
              { key: "status", label: "Status" }
            ]}
            rows={rows}
            onEdit={setEditingRule}
          />
        ) : <EmptyStateCard title="No commission rules yet" description="Add governed commercial rules before creating revenue entitlements." />}
      </AccessGuard>
      <AccessGuard permission="commission_rules.manage">
        <GovernanceRuleFormCard
          title="Create commission rule"
          fields={fields}
          initialValues={initialValues}
          record={editingRule}
          onSubmit={submitRule}
          submitLabel="Create rule"
          onCancel={() => setEditingRule(null)}
        />
      </AccessGuard>
    </div>
  );
}
