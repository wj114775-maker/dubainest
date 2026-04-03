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
import { listEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, disputeTypeOptions, severityOptions } from "@/lib/revenue";

export default function PartnerDisputes() {
  const { data: current } = useCurrentUserRole();
  const queryClient = useQueryClient();

  const { data: workspace = { partnerAgencyId: "", invoices: [], disputes: [] } } = useQuery({
    queryKey: ["partner-disputes", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, invoices, disputes] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        listEntitySafe("InvoiceRecord", "-updated_date", 200),
        listEntitySafe("RevenueDispute", "-updated_date", 200)
      ]);

      const partnerAgencyId = profiles[0]?.partner_agency_id || "";
      return {
        partnerAgencyId,
        invoices: invoices.filter((item) => item.partner_id === partnerAgencyId),
        disputes: disputes.filter((item) => item.partner_id === partnerAgencyId)
      };
    },
    initialData: { partnerAgencyId: "", invoices: [], disputes: [] }
  });

  const revenueAction = useMutation({
    mutationFn: (payload) => base44.functions.invoke("partnerManageRevenueCase", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-disputes", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["partner-revenue-workspace", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
  });

  const summary = [
    { label: "Disputes", value: String(workspace.disputes.length) },
    { label: "Open", value: String(workspace.disputes.filter((item) => !["resolved", "rejected", "closed"].includes(item.status)).length) },
    { label: "Critical", value: String(workspace.disputes.filter((item) => item.severity === "critical").length) },
    { label: "Payment-related", value: String(workspace.disputes.filter((item) => item.dispute_type === "partial_payment_dispute").length) }
  ];

  const disputableInvoices = workspace.invoices
    .filter((item) => ["issued", "acknowledged", "partially_paid", "overdue", "disputed"].includes(item.invoice_status))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.invoice_number || item.id,
      meta: [item.invoice_status ? compactLabel(item.invoice_status) : null, item.due_date ? `Due ${new Date(item.due_date).toLocaleDateString()}` : null].filter(Boolean).join(" · "),
      status: item.invoice_status,
      amount: Number(item.net_amount || item.gross_amount || 0),
      currency: item.currency,
      source: item
    }));

  const disputeItems = workspace.disputes.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.summary || item.id,
    meta: [compactLabel(item.dispute_type), item.opened_at ? new Date(item.opened_at).toLocaleDateString() : null].filter(Boolean).join(" · "),
    status: item.status,
    amount: 0,
    badges: [item.severity].filter(Boolean),
    source: item
  }));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Disputes" title="Commercial dispute workflow" description="Partners can raise fee, attribution, trigger, documentation, and payment disputes against live commercial records." />
      <AdminSummaryStrip items={summary} />
      {workspace.partnerAgencyId ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <RevenueQueueCard
            title="Disputable invoices"
            items={disputableInvoices}
            emptyMessage="No invoices available for dispute review."
            renderActions={(item) => (
              <RevenueWorkflowDialog
                title="Raise dispute"
                description="Open a formal commercial dispute linked to this invoice."
                actionLabel="Open dispute"
                loading={revenueAction.isPending}
                fields={[
                  { key: "dispute_type", label: "Dispute type", type: "select", options: disputeTypeOptions, required: true },
                  { key: "severity", label: "Severity", type: "select", options: severityOptions, required: true },
                  { key: "summary", label: "Summary", type: "textarea", required: true },
                  { key: "notes", label: "Partner note", type: "textarea" }
                ]}
                initialValues={{ severity: "medium" }}
                onSubmit={(form) => revenueAction.mutate({
                  action: "raise_dispute",
                  invoice_id: item.source.id,
                  dispute_type: form.dispute_type,
                  severity: form.severity,
                  summary: form.summary,
                  notes: form.notes
                })}
              >
                <Button variant="outline">Raise dispute</Button>
              </RevenueWorkflowDialog>
            )}
          />
          <RevenueQueueCard
            title="Active disputes"
            items={disputeItems}
            emptyMessage="No disputes opened yet."
            renderActions={(item) => (
              <>
                <RevenueWorkflowDialog
                  title="Add commercial note"
                  description="Add supporting context or evidence to this dispute."
                  actionLabel="Add note"
                  loading={revenueAction.isPending}
                  fields={[
                    { key: "summary", label: "Summary", type: "textarea", required: true },
                    { key: "file_url", label: "Evidence URL" }
                  ]}
                  onSubmit={(form) => revenueAction.mutate({
                    action: "add_commercial_note",
                    dispute_id: item.source.id,
                    summary: form.summary,
                    file_url: form.file_url
                  })}
                >
                  <Button variant="outline">Add note</Button>
                </RevenueWorkflowDialog>
                <RevenueWorkflowDialog
                  title="Request clarification"
                  description="Ask the internal finance reviewer to clarify the current dispute position."
                  actionLabel="Request clarification"
                  loading={revenueAction.isPending}
                  fields={[{ key: "summary", label: "Clarification request", type: "textarea", required: true }]}
                  onSubmit={(form) => revenueAction.mutate({
                    action: "request_clarification",
                    dispute_id: item.source.id,
                    summary: form.summary
                  })}
                >
                  <Button variant="outline">Clarify</Button>
                </RevenueWorkflowDialog>
              </>
            )}
          />
        </div>
      ) : <EmptyStateCard title="Partner profile missing" description="Link this user to a partner agency before using the dispute workspace." />}
    </div>
  );
}
