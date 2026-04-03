import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import RevenueQueueCard from "@/components/revenue/RevenueQueueCard";
import RevenueWorkflowDialog from "@/components/revenue/RevenueWorkflowDialog";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { Button } from "@/components/ui/button";
import { formatCurrency, getEntitlementAmount, isOverdueDate } from "@/lib/revenue";

export default function PartnerPayouts() {
  const { data: current } = useCurrentUserRole();
  const queryClient = useQueryClient();

  const { data: workspace = { partnerAgencyId: "", entitlements: [], invoices: [], payouts: [], settlements: [] } } = useQuery({
    queryKey: ["partner-revenue-workspace", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, entitlements, invoices, payouts, settlements] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        base44.entities.RevenueEntitlement.list("-updated_date", 200),
        base44.entities.InvoiceRecord.list("-updated_date", 200),
        base44.entities.PayoutRecord.list("-updated_date", 200),
        base44.entities.SettlementRecord.list("-updated_date", 200)
      ]);

      const partnerAgencyId = profiles[0]?.partner_agency_id || "";
      return {
        partnerAgencyId,
        entitlements: entitlements.filter((item) => item.partner_id === partnerAgencyId),
        invoices: invoices.filter((item) => item.partner_id === partnerAgencyId),
        payouts: payouts.filter((item) => item.partner_id === partnerAgencyId),
        settlements: settlements.filter((item) => item.partner_id === partnerAgencyId)
      };
    },
    initialData: { partnerAgencyId: "", entitlements: [], invoices: [], payouts: [], settlements: [] }
  });

  const revenueAction = useMutation({
    mutationFn: (payload) => base44.functions.invoke("partnerManageRevenueCase", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-revenue-workspace", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["partner-disputes", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
  });

  const pendingCharges = workspace.entitlements
    .filter((item) => ["approved", "invoiced", "awaiting_payment", "partially_paid", "disputed", "adjusted"].includes(item.entitlement_status))
    .reduce((sum, item) => sum + Math.max(0, Number(item.net_amount || item.gross_amount || 0) - Number(item.paid_amount || 0)), 0);

  const issuedInvoices = workspace.invoices.filter((item) => ["issued", "acknowledged", "partially_paid", "overdue", "disputed"].includes(item.invoice_status)).length;
  const overdueValue = workspace.invoices
    .filter((item) => isOverdueDate(item.due_date) && !["paid", "void"].includes(item.invoice_status))
    .reduce((sum, item) => sum + Number(item.net_amount || item.gross_amount || 0), 0);
  const paidValue = workspace.payouts.reduce((sum, item) => sum + Number(item.paid_amount || 0), 0);
  const settlementCount = workspace.settlements.filter((item) => !["paid", "cancelled", "failed"].includes(item.settlement_status)).length;

  const summary = [
    { label: "Pending charges", value: formatCurrency(pendingCharges) },
    { label: "Issued invoices", value: String(issuedInvoices) },
    { label: "Overdue value", value: formatCurrency(overdueValue) },
    { label: "Paid history", value: formatCurrency(paidValue) },
    { label: "Open settlements", value: String(settlementCount) }
  ];

  const entitlementItems = workspace.entitlements.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.notes || item.trigger_type || item.id,
    meta: [item.trigger_type, item.invoice_id ? "Invoice linked" : null].filter(Boolean).join(" · "),
    status: item.entitlement_status,
    amount: getEntitlementAmount(item),
    currency: item.currency
  }));

  const invoiceItems = workspace.invoices.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.invoice_number || item.id,
    meta: [item.due_date ? `Due ${new Date(item.due_date).toLocaleDateString()}` : null, item.external_reference].filter(Boolean).join(" · "),
    status: item.invoice_status,
    amount: Number(item.net_amount || item.gross_amount || 0),
    currency: item.currency,
    source: item
  }));

  const paymentItems = workspace.payouts.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.transaction_reference || item.id,
    meta: [item.payment_method, item.received_date ? `Received ${new Date(item.received_date).toLocaleDateString()}` : null].filter(Boolean).join(" · "),
    status: item.payout_status,
    amount: Number(item.paid_amount || item.expected_amount || 0),
    currency: item.currency,
    source: item
  }));

  const settlementItems = workspace.settlements.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.notes || item.settlement_type || item.id,
    meta: [item.agreed_at ? `Agreed ${new Date(item.agreed_at).toLocaleDateString()}` : null].filter(Boolean).join(" · "),
    status: item.settlement_status,
    amount: Number(item.agreed_amount || 0),
    currency: item.currency
  }));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Commercials" title="Invoices, payments, and settlement visibility" description="Partners can track pending charges, invoice due dates, payment state, dispute exposure, and settlement progress without relying on email alone." />
      <AdminSummaryStrip items={summary} />
      {workspace.partnerAgencyId ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <RevenueQueueCard title="Pending entitlements" items={entitlementItems} emptyMessage="No partner revenue items yet." />
          <RevenueQueueCard
            title="Issued invoices"
            items={invoiceItems}
            emptyMessage="No invoices issued yet."
            renderActions={(item) => (
              <>
                <RevenueWorkflowDialog
                  title="Acknowledge invoice"
                  description="Confirm that this invoice has been reviewed by the partner."
                  actionLabel="Acknowledge"
                  loading={revenueAction.isPending}
                  fields={[{ key: "notes", label: "Partner note", type: "textarea" }]}
                  onSubmit={(form) => revenueAction.mutate({ action: "acknowledge_invoice", invoice_id: item.source.id, notes: form.notes })}
                >
                  <Button variant="outline">Acknowledge</Button>
                </RevenueWorkflowDialog>
                <RevenueWorkflowDialog
                  title="Upload payment proof"
                  description="Attach a payment receipt or proof of transfer for this invoice."
                  actionLabel="Upload proof"
                  loading={revenueAction.isPending}
                  fields={[
                    { key: "file_url", label: "Receipt URL", required: true },
                    { key: "summary", label: "Summary", type: "textarea", required: true }
                  ]}
                  onSubmit={(form) => revenueAction.mutate({ action: "upload_payment_evidence", invoice_id: item.source.id, file_url: form.file_url, summary: form.summary })}
                >
                  <Button variant="outline">Upload proof</Button>
                </RevenueWorkflowDialog>
                <RevenueWorkflowDialog
                  title="Request clarification"
                  description="Ask finance to clarify the basis, timing, or amount of this invoice."
                  actionLabel="Request clarification"
                  loading={revenueAction.isPending}
                  fields={[
                    { key: "summary", label: "Clarification request", type: "textarea", required: true },
                    { key: "notes", label: "Partner note", type: "textarea" }
                  ]}
                  onSubmit={(form) => revenueAction.mutate({ action: "request_clarification", invoice_id: item.source.id, summary: form.summary, notes: form.notes })}
                >
                  <Button variant="outline">Clarify</Button>
                </RevenueWorkflowDialog>
              </>
            )}
          />
          <RevenueQueueCard title="Payment history" items={paymentItems} emptyMessage="No payment history yet." />
          <RevenueQueueCard title="Settlement status" items={settlementItems} emptyMessage="No settlements recorded yet." />
        </div>
      ) : <EmptyStateCard title="Partner profile missing" description="Link this user to a partner agency before using the commercial workspace." />}
    </div>
  );
}
