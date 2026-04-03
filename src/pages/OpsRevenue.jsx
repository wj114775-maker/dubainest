import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import RevenueQueueCard from "@/components/revenue/RevenueQueueCard";
import RevenueWorkflowDialog from "@/components/revenue/RevenueWorkflowDialog";
import RevenueFilters from "@/components/revenue/RevenueFilters";
import { Button } from "@/components/ui/button";
import { formatCurrency, getEntitlementAmount, isOverdueDate, triggerTypeOptions } from "@/lib/revenue";

export default function OpsRevenue() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", status: "all", partner: "all", trigger: "all", rule: "all", special: "all" });

  const { data: workspace = { entitlements: [], invoices: [], payouts: [], disputes: [], settlements: [] } } = useQuery({
    queryKey: ["ops-revenue-workspace"],
    queryFn: async () => {
      const [entitlements, invoices, payouts, disputes, settlements] = await Promise.all([
        base44.entities.RevenueEntitlement.list("-updated_date", 200),
        base44.entities.InvoiceRecord.list("-updated_date", 200),
        base44.entities.PayoutRecord.list("-updated_date", 200),
        base44.entities.RevenueDispute.list("-updated_date", 200),
        base44.entities.SettlementRecord.list("-updated_date", 200)
      ]);

      return { entitlements, invoices, payouts, disputes, settlements };
    },
    initialData: { entitlements: [], invoices: [], payouts: [], disputes: [], settlements: [] }
  });

  const createEntitlement = useMutation({
    mutationFn: (payload) => base44.functions.invoke("createRevenueEntitlement", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-revenue-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["ops-dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
  });

  const reconcileRevenue = useMutation({
    mutationFn: () => base44.functions.invoke("reconcileRevenueOperations", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-revenue-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["ops-dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  const { entitlements, invoices, payouts, disputes, settlements } = workspace;
  const entitlementMap = useMemo(() => new Map(entitlements.map((item) => [item.id, item])), [entitlements]);
  const invoiceByEntitlement = useMemo(() => new Map(invoices.map((item) => [item.entitlement_id, item])), [invoices]);
  const payoutByEntitlement = useMemo(() => new Map(payouts.map((item) => [item.entitlement_id, item])), [payouts]);
  const searchValue = filters.search.trim().toLowerCase();

  const filteredEntitlements = useMemo(() => entitlements.filter((item) => {
    const snapshot = item.calculation_snapshot_json || {};
    const inputs = snapshot.input_values || {};
    const linkedInvoice = invoiceByEntitlement.get(item.id);
    const linkedPayout = payoutByEntitlement.get(item.id);
    const searchMatch = !searchValue || [
      item.id,
      item.partner_id,
      item.lead_id,
      item.notes,
      item.trigger_type,
      snapshot.rule_code,
      inputs.lead_type,
      inputs.buyer_type
    ].filter(Boolean).join(" ").toLowerCase().includes(searchValue);
    const statusMatch = filters.status === "all"
      || item.entitlement_status === filters.status
      || (filters.status === "overdue" && ((linkedInvoice && isOverdueDate(linkedInvoice.due_date) && !["paid", "void"].includes(linkedInvoice.invoice_status)) || (linkedPayout && isOverdueDate(linkedPayout.expected_date) && !["paid", "reversed"].includes(linkedPayout.payout_status))));
    const partnerMatch = filters.partner === "all" || item.partner_id === filters.partner;
    const triggerMatch = filters.trigger === "all" || item.trigger_type === filters.trigger;
    const ruleMatch = filters.rule === "all" || (snapshot.rule_code || item.commission_rule_id) === filters.rule;
    const specialMatch = filters.special === "all"
      || (filters.special === "private_inventory" && Boolean(inputs.is_private_inventory))
      || (filters.special === "high_value" && Boolean(inputs.is_high_value))
      || (filters.special === "concierge" && [inputs.lead_type, inputs.buyer_type, item.notes].filter(Boolean).join(" ").toLowerCase().includes("concierge"));
    return searchMatch && statusMatch && partnerMatch && triggerMatch && ruleMatch && specialMatch;
  }), [entitlements, invoiceByEntitlement, payoutByEntitlement, searchValue, filters]);

  const filteredEntitlementIds = useMemo(() => new Set(filteredEntitlements.map((item) => item.id)), [filteredEntitlements]);
  const filteredInvoices = useMemo(() => invoices.filter((item) => {
    const linkedEntitlement = entitlementMap.get(item.entitlement_id);
    const entitlementMatch = !linkedEntitlement || filteredEntitlementIds.has(linkedEntitlement.id);
    const searchMatch = !searchValue || [item.invoice_number, item.external_reference, item.partner_id].filter(Boolean).join(" ").toLowerCase().includes(searchValue);
    const statusMatch = filters.status === "all"
      || item.invoice_status === filters.status
      || (filters.status === "awaiting_payment" && ["issued", "acknowledged", "overdue"].includes(item.invoice_status))
      || (filters.status === "overdue" && isOverdueDate(item.due_date) && !["paid", "void"].includes(item.invoice_status));
    return entitlementMatch && searchMatch && statusMatch;
  }), [invoices, entitlementMap, filteredEntitlementIds, searchValue, filters.status]);

  const filteredPayouts = useMemo(() => payouts.filter((item) => {
    const linkedEntitlement = entitlementMap.get(item.entitlement_id);
    const entitlementMatch = !linkedEntitlement || filteredEntitlementIds.has(linkedEntitlement.id);
    const statusMatch = filters.status === "all"
      || item.payout_status === filters.status
      || (filters.status === "overdue" && isOverdueDate(item.expected_date) && !["paid", "reversed"].includes(item.payout_status));
    return entitlementMatch && statusMatch;
  }), [payouts, entitlementMap, filteredEntitlementIds, filters.status]);

  const filteredDisputes = useMemo(() => disputes.filter((item) => {
    const linkedEntitlement = entitlementMap.get(item.entitlement_id);
    const entitlementMatch = !linkedEntitlement || filteredEntitlementIds.has(linkedEntitlement.id);
    const searchMatch = !searchValue || [item.summary, item.partner_id, item.dispute_type].filter(Boolean).join(" ").toLowerCase().includes(searchValue);
    const statusMatch = filters.status === "all" || item.status === filters.status || (filters.status === "disputed" && !["resolved", "rejected", "closed"].includes(item.status));
    return entitlementMatch && searchMatch && statusMatch;
  }), [disputes, entitlementMap, filteredEntitlementIds, searchValue, filters.status]);

  const filteredSettlements = useMemo(() => settlements.filter((item) => {
    const linkedEntitlement = entitlementMap.get(item.entitlement_id);
    const entitlementMatch = !linkedEntitlement || filteredEntitlementIds.has(linkedEntitlement.id);
    const searchMatch = !searchValue || [item.notes, item.partner_id, item.settlement_type].filter(Boolean).join(" ").toLowerCase().includes(searchValue);
    return entitlementMatch && searchMatch;
  }), [settlements, entitlementMap, filteredEntitlementIds, searchValue]);

  const partnerOptions = useMemo(() => Array.from(new Set(entitlements.map((item) => item.partner_id).filter(Boolean))).sort(), [entitlements]);
  const triggerOptions = useMemo(() => Array.from(new Set(entitlements.map((item) => item.trigger_type).filter(Boolean))).sort(), [entitlements]);
  const ruleOptions = useMemo(() => Array.from(new Set(entitlements.map((item) => item.calculation_snapshot_json?.rule_code || item.commission_rule_id).filter(Boolean))).sort(), [entitlements]);

  const pipelineValue = filteredEntitlements
    .filter((item) => !["paid", "reversed", "written_off", "rejected"].includes(item.entitlement_status))
    .reduce((sum, item) => sum + getEntitlementAmount(item), 0);

  const approvedUninvoiced = filteredEntitlements
    .filter((item) => item.entitlement_status === "approved")
    .reduce((sum, item) => sum + getEntitlementAmount(item), 0);

  const awaitingPayment = filteredEntitlements
    .filter((item) => ["invoiced", "awaiting_payment", "partially_paid"].includes(item.entitlement_status))
    .reduce((sum, item) => sum + Math.max(0, Number(item.net_amount || item.gross_amount || 0) - Number(item.paid_amount || 0)), 0);

  const overduePayments = filteredInvoices
    .filter((item) => isOverdueDate(item.due_date) && !["paid", "void"].includes(item.invoice_status))
    .reduce((sum, item) => sum + Number(item.net_amount || item.gross_amount || 0), 0);

  const disputedAmounts = filteredEntitlements
    .filter((item) => item.entitlement_status === "disputed")
    .reduce((sum, item) => sum + getEntitlementAmount(item), 0);

  const paidThisPeriod = filteredEntitlements
    .filter((item) => item.entitlement_status === "paid")
    .reduce((sum, item) => sum + Number(item.paid_amount || item.net_amount || item.gross_amount || 0), 0);

  const partnerBalances = filteredPayouts.reduce((sum, item) => sum + Math.max(0, Number(item.expected_amount || 0) - Number(item.paid_amount || 0)), 0);

  const summary = [
    { label: "Pipeline value", value: formatCurrency(pipelineValue) },
    { label: "Approved uninvoiced", value: formatCurrency(approvedUninvoiced) },
    { label: "Awaiting payment", value: formatCurrency(awaitingPayment) },
    { label: "Overdue payments", value: formatCurrency(overduePayments) },
    { label: "Disputed amounts", value: formatCurrency(disputedAmounts) },
    { label: "Paid this period", value: formatCurrency(paidThisPeriod) },
    { label: "Partner balances", value: formatCurrency(partnerBalances) }
  ];

  const entitlementQueue = filteredEntitlements.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.notes || item.trigger_type || item.id,
    meta: [item.partner_id, item.trigger_type, item.lead_id].filter(Boolean).join(" · "),
    status: item.entitlement_status,
    amount: getEntitlementAmount(item),
    currency: item.currency,
    badges: [item.invoice_id ? "invoiced" : null, item.payout_id ? "payout-linked" : null].filter(Boolean)
  }));

  const invoiceQueue = filteredInvoices.slice(0, 8).map((item) => ({
    id: item.entitlement_id || item.id,
    title: item.invoice_number || item.id,
    meta: [item.partner_id, item.due_date ? `Due ${new Date(item.due_date).toLocaleDateString()}` : null].filter(Boolean).join(" · "),
    status: item.invoice_status,
    amount: Number(item.net_amount || item.gross_amount || 0),
    currency: item.currency,
    badges: [isOverdueDate(item.due_date) && !["paid", "void"].includes(item.invoice_status) ? "overdue" : null].filter(Boolean)
  }));

  const disputeQueue = filteredDisputes.slice(0, 8).map((item) => ({
    id: item.entitlement_id || item.id,
    title: item.summary || item.id,
    meta: [item.partner_id, item.dispute_type, item.opened_at ? new Date(item.opened_at).toLocaleDateString() : null].filter(Boolean).join(" · "),
    status: item.status,
    amount: 0,
    badges: [item.severity].filter(Boolean)
  }));

  const settlementQueue = filteredSettlements.slice(0, 8).map((item) => ({
    id: item.entitlement_id || item.id,
    title: item.notes || item.settlement_type || item.id,
    meta: [item.partner_id, item.agreed_at ? `Agreed ${new Date(item.agreed_at).toLocaleDateString()}` : null].filter(Boolean).join(" · "),
    status: item.settlement_status,
    amount: Number(item.agreed_amount || 0),
    currency: item.currency,
    badges: [item.settlement_type].filter(Boolean)
  }));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Revenue"
        title="Entitlement, invoice, payout, dispute, and settlement control"
        description="Finance teams manage the full commercial lifecycle from governed trigger to settlement, with calculation snapshots and defendable audit history."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link to="/ops/commission-rules">Commission rules</Link></Button>
            <Button variant="outline" onClick={() => reconcileRevenue.mutate()} disabled={reconcileRevenue.isPending}>Reconcile revenue states</Button>
            <RevenueWorkflowDialog
              title="Create manual revenue trigger"
              description="Use this when a commercial trigger needs to be recorded directly by finance or operations."
              actionLabel="Create entitlement"
              loading={createEntitlement.isPending}
              fields={[
                { key: "lead_id", label: "Lead id" },
                { key: "partner_id", label: "Partner id", required: true },
                { key: "event_type", label: "Trigger type", type: "select", options: triggerTypeOptions, required: true },
                { key: "event_date", label: "Trigger date", type: "date", required: true },
                { key: "summary", label: "Summary", type: "textarea", required: true },
                { key: "trigger_source", label: "Trigger source" },
                { key: "deal_value", label: "Deal value", type: "number" },
                { key: "partner_commission_amount", label: "Partner commission amount", type: "number" },
                { key: "manual_amount", label: "Manual amount", type: "number" },
                { key: "tax_amount", label: "Tax amount", type: "number" },
                { key: "currency", label: "Currency" },
                { key: "listing_type", label: "Listing type" },
                { key: "lead_type", label: "Lead type" },
                { key: "buyer_type", label: "Buyer type" },
                { key: "is_private_inventory", label: "Private inventory", type: "checkbox" },
                { key: "is_high_value", label: "High value", type: "checkbox" }
              ]}
              initialValues={{
                event_type: "manual",
                event_date: new Date().toISOString().slice(0, 10),
                trigger_source: "manual",
                currency: "AED"
              }}
              onSubmit={(form) => createEntitlement.mutate({
                lead_id: form.lead_id,
                partner_id: form.partner_id,
                event_type: form.event_type,
                event_date: form.event_date ? new Date(form.event_date).toISOString() : new Date().toISOString(),
                summary: form.summary,
                trigger_source: form.trigger_source || "manual",
                deal_value: Number(form.deal_value || 0),
                partner_commission_amount: Number(form.partner_commission_amount || 0),
                manual_amount: Number(form.manual_amount || 0),
                tax_amount: Number(form.tax_amount || 0),
                currency: form.currency || "AED",
                listing_type: form.listing_type,
                lead_type: form.lead_type,
                buyer_type: form.buyer_type,
                is_private_inventory: Boolean(form.is_private_inventory),
                is_high_value: Boolean(form.is_high_value)
              })}
            >
              <Button>Create revenue trigger</Button>
            </RevenueWorkflowDialog>
          </div>
        )}
      />
      <AccessGuard permission="revenue.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>
      <AccessGuard permission="revenue.read">
        <RevenueFilters
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          partners={partnerOptions}
          triggers={triggerOptions}
          rules={ruleOptions}
        />
      </AccessGuard>
      <AccessGuard permission="revenue.read">
        <div className="grid gap-6 xl:grid-cols-2">
          <RevenueQueueCard title="Entitlements queue" items={entitlementQueue} linkBase="/ops/revenue" emptyMessage="No entitlements created yet." />
          <RevenueQueueCard title="Invoice queue" items={invoiceQueue} linkBase="/ops/revenue" emptyMessage="No invoices issued yet." />
          <RevenueQueueCard title="Dispute queue" items={disputeQueue} linkBase="/ops/revenue" emptyMessage="No disputes opened yet." />
          <RevenueQueueCard title="Settlement queue" items={settlementQueue} linkBase="/ops/revenue" emptyMessage="No settlements recorded yet." />
        </div>
      </AccessGuard>
    </div>
  );
}
