import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import PayoutLedgerTable from "@/components/partner/PayoutLedgerTable";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminRecordFormCard from "@/components/admin/AdminRecordFormCard";

export default function OpsRevenue() {
  const queryClient = useQueryClient();
  const [payoutForm, setPayoutForm] = useState({ partner_agency_id: "", amount: "", currency: "AED", paid_on: "", status: "scheduled", immutable_reference: "" });
  const [ruleForm, setRuleForm] = useState({ name: "", rule_scope: "global", scope_id: "global", calculation_mode: "percentage", value: "", conditions: "{}", status: "active" });

  const { data: entries = [] } = useQuery({
    queryKey: ["ops-revenue-payouts"],
    queryFn: () => base44.entities.Payout.list(),
    initialData: []
  });

  const rows = entries.map((item) => ({
    id: item.id,
    reference: item.reference || item.invoice_number || item.immutable_reference || item.id,
    status: item.status || "draft",
    amount: Number(item.amount || 0)
  }));

  const manageRecord = useMutation({
    mutationFn: ({ entityName, payload, summary }) => base44.functions.invoke("adminManageGovernanceRecord", { entityName, action: "create", payload, summary, scope: "finance" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-revenue-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["ops-commission-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Revenue" title="Commission ledger, invoice and payout control" description="Finance teams manage accruals, approvals, payment state and dispute exposure from one ledger surface." />
      <AccessGuard permission="payouts.read">
        <PayoutLedgerTable entries={rows} />
      </AccessGuard>
      <AccessGuard permission="payouts.manage">
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminRecordFormCard
            title="Create payout"
            values={payoutForm}
            onChange={(key, value) => setPayoutForm((current) => ({ ...current, [key]: value }))}
            fields={[{ key: "partner_agency_id", label: "Partner agency id" }, { key: "amount", label: "Amount" }, { key: "currency", label: "Currency" }, { key: "paid_on", label: "Paid on (YYYY-MM-DD)" }, { key: "status", label: "Status" }, { key: "immutable_reference", label: "Reference" }]}
            onSubmit={() => manageRecord.mutate({ entityName: "Payout", payload: { ...payoutForm, amount: Number(payoutForm.amount || 0) }, summary: "Payout created" })}
            submitLabel="Create payout"
          />
          <AdminRecordFormCard
            title="Create commission rule"
            values={ruleForm}
            onChange={(key, value) => setRuleForm((current) => ({ ...current, [key]: value }))}
            fields={[{ key: "name", label: "Rule name" }, { key: "rule_scope", label: "Rule scope" }, { key: "scope_id", label: "Scope id" }, { key: "calculation_mode", label: "Calculation mode" }, { key: "value", label: "Value" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true }]}
            onSubmit={() => manageRecord.mutate({ entityName: "CommissionRule", payload: { ...ruleForm, value: Number(ruleForm.value || 0), conditions: JSON.parse(ruleForm.conditions || "{}") }, summary: "Commission rule created" })}
            submitLabel="Create rule"
          />
        </div>
      </AccessGuard>
    </div>
  );
}