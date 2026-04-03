import React from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RevenueWorkflowDialog from "@/components/revenue/RevenueWorkflowDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { compactLabel, disputeTypeOptions, evidenceTypeOptions, formatCurrency, paymentMethodOptions, settlementTypeOptions, severityOptions } from "@/lib/revenue";

function DataListCard({ title, items = [], render, emptyMessage = "No records yet." }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map(render) : <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
      </CardContent>
    </Card>
  );
}

export default function OpsRevenueDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-revenue-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const entitlement = await base44.entities.RevenueEntitlement.get(id);
      const [event, rule, ledger, invoices, payouts, disputes, adjustments, settlements, evidence, audit] = await Promise.all([
        entitlement?.revenue_event_id ? base44.entities.RevenueEvent.get(entitlement.revenue_event_id) : Promise.resolve(null),
        entitlement?.commission_rule_id ? base44.entities.CommissionRule.get(entitlement.commission_rule_id) : Promise.resolve(null),
        base44.entities.RevenueLedger.filter({ entitlement_id: id }),
        base44.entities.InvoiceRecord.filter({ entitlement_id: id }),
        base44.entities.PayoutRecord.filter({ entitlement_id: id }),
        base44.entities.RevenueDispute.filter({ entitlement_id: id }),
        base44.entities.RevenueAdjustment.filter({ entitlement_id: id }),
        base44.entities.SettlementRecord.filter({ entitlement_id: id }),
        base44.entities.RevenueEvidence.filter({ entitlement_id: id }),
        base44.entities.AuditLog.filter({ entity_id: id })
      ]);
      return { entitlement, event, rule, ledger, invoices, payouts, disputes, adjustments, settlements, evidence, audit };
    },
    initialData: null
  });

  const workflowMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke("internalManageRevenueWorkflow", { entitlement_id: id, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-revenue-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-revenue-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["ops-dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
  });

  if (isLoading || !data?.entitlement) {
    return <div className="text-sm text-muted-foreground">Loading revenue workspace...</div>;
  }

  const { entitlement, event, rule, ledger, invoices, payouts, disputes, adjustments, settlements, evidence, audit } = data;
  const primaryInvoice = invoices[0] || null;
  const primaryPayout = payouts[0] || null;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Money desk detail"
        title={entitlement.notes || entitlement.id}
        description="Review trigger basis, calculation snapshot, ledger history, invoice, payment, disputes, adjustments, settlements, evidence, and audit from one governed workspace."
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <Badge variant="outline">{compactLabel(entitlement.entitlement_status)}</Badge>
          <Badge variant="outline">{compactLabel(entitlement.trigger_type)}</Badge>
          <Badge variant="outline">{formatCurrency(entitlement.net_amount || entitlement.gross_amount || 0, entitlement.currency || "AED")}</Badge>
          {primaryInvoice ? <Badge variant="outline">Invoice {compactLabel(primaryInvoice.invoice_status)}</Badge> : null}
          {primaryPayout ? <Badge variant="outline">Payment {compactLabel(primaryPayout.payout_status)}</Badge> : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr,340px]">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trigger">Trigger</TabsTrigger>
            <TabsTrigger value="calculation">Calculation</TabsTrigger>
            <TabsTrigger value="ledger">Ledger</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
            <TabsTrigger value="settlements">Settlements</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardContent className="grid gap-3 p-5 md:grid-cols-2">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Partner: {entitlement.partner_id || "—"}</p>
                  <p>Lead: {entitlement.lead_id || "—"}</p>
                  <p>Rule: {rule?.name || entitlement.commission_rule_id || "—"}</p>
                  <p>Trigger date: {entitlement.trigger_date ? new Date(entitlement.trigger_date).toLocaleString() : "—"}</p>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Gross: {formatCurrency(entitlement.gross_amount || 0, entitlement.currency || "AED")}</p>
                  <p>Tax: {formatCurrency(entitlement.tax_amount || 0, entitlement.currency || "AED")}</p>
                  <p>Net: {formatCurrency(entitlement.net_amount || entitlement.gross_amount || 0, entitlement.currency || "AED")}</p>
                  <p>Paid: {formatCurrency(entitlement.paid_amount || 0, entitlement.currency || "AED")}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trigger">
            <div className="grid gap-6 xl:grid-cols-2">
              <DataListCard
                title="Revenue trigger"
                items={event ? [event] : []}
                emptyMessage="No trigger event attached."
                render={(item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{compactLabel(item.event_type)}</p>
                    <p>{item.summary || "No summary"}</p>
                    <p>{item.event_date ? new Date(item.event_date).toLocaleString() : "—"}</p>
                    <p>{item.trigger_source || "manual"}</p>
                  </div>
                )}
              />
              <DataListCard
                title="Rule basis"
                items={rule ? [rule] : []}
                emptyMessage="No commission rule linked."
                render={(item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p>{[item.rule_code, item.trigger_type, item.fee_type].filter(Boolean).join(" · ")}</p>
                    <p>{item.calculation_method}</p>
                    <p>Priority {item.priority || 0}</p>
                  </div>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="calculation">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Calculation snapshot</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Gross</p><p className="text-xl font-semibold">{formatCurrency(entitlement.gross_amount || 0, entitlement.currency || "AED")}</p></div>
                  <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Tax</p><p className="text-xl font-semibold">{formatCurrency(entitlement.tax_amount || 0, entitlement.currency || "AED")}</p></div>
                  <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Net</p><p className="text-xl font-semibold">{formatCurrency(entitlement.net_amount || entitlement.gross_amount || 0, entitlement.currency || "AED")}</p></div>
                </div>
                <pre className="overflow-auto rounded-2xl border border-white/10 bg-muted/20 p-4 text-xs text-muted-foreground">{JSON.stringify(entitlement.calculation_snapshot_json || {}, null, 2)}</pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledger">
            <DataListCard
              title="Ledger history"
              items={ledger}
              render={(item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{compactLabel(item.entry_type)}</p>
                      <p className="text-sm text-muted-foreground">{item.summary || item.reference_code || "No summary"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.amount || 0, item.currency || entitlement.currency || "AED")}</p>
                      <p className="text-xs text-muted-foreground">{item.entry_date ? new Date(item.entry_date).toLocaleString() : "—"}</p>
                    </div>
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="invoice">
            <DataListCard
              title="Invoice records"
              items={invoices}
              render={(item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{item.invoice_number}</p>
                  <p>{[compactLabel(item.invoice_status), item.due_date ? `Due ${new Date(item.due_date).toLocaleDateString()}` : null].filter(Boolean).join(" · ")}</p>
                  <p>{formatCurrency(item.net_amount || item.gross_amount || 0, item.currency || entitlement.currency || "AED")}</p>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="payment">
            <DataListCard
              title="Payout records"
              items={payouts}
              render={(item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{compactLabel(item.payout_status)}</p>
                  <p>{formatCurrency(item.paid_amount || 0, item.currency || entitlement.currency || "AED")} paid of {formatCurrency(item.expected_amount || 0, item.currency || entitlement.currency || "AED")}</p>
                  <p>{[item.payment_method, item.transaction_reference].filter(Boolean).join(" · ") || "No payment reference yet."}</p>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="disputes">
            <DataListCard
              title="Revenue disputes"
              items={disputes}
              render={(item) => (
                <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{compactLabel(item.status)}</Badge>
                    <Badge variant="outline">{compactLabel(item.dispute_type)}</Badge>
                    <Badge variant="outline">{compactLabel(item.severity)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{item.summary}</p>
                    <p>{item.opened_at ? new Date(item.opened_at).toLocaleString() : "—"}</p>
                    <p>{item.notes || item.resolution_notes || "No notes recorded."}</p>
                  </div>
                  {item.status !== "resolved" && item.status !== "closed" ? (
                    <RevenueWorkflowDialog
                      title="Resolve dispute"
                      description="Resolve this commercial dispute and restore the entitlement workflow."
                      actionLabel="Resolve dispute"
                      loading={workflowMutation.isPending}
                      fields={[{ key: "notes", label: "Resolution notes", type: "textarea", required: true }]}
                      onSubmit={(form) => workflowMutation.mutate({ action: "resolve_dispute", dispute_id: item.id, notes: form.notes })}
                    >
                      <Button variant="outline">Resolve</Button>
                    </RevenueWorkflowDialog>
                  ) : null}
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="adjustments">
            <DataListCard
              title="Adjustments"
              items={adjustments}
              render={(item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{compactLabel(item.adjustment_type)}</p>
                  <p>{formatCurrency(item.amount_delta || 0, entitlement.currency || "AED")}</p>
                  <p>{item.reason}</p>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="settlements">
            <DataListCard
              title="Settlements"
              items={settlements}
              render={(item) => (
                <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{compactLabel(item.settlement_status)}</Badge>
                    <Badge variant="outline">{compactLabel(item.settlement_type)}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{formatCurrency(item.agreed_amount || 0, item.currency || entitlement.currency || "AED")}</p>
                    <p>{[item.agreed_at ? `Agreed ${new Date(item.agreed_at).toLocaleDateString()}` : null, item.paid_at ? `Paid ${new Date(item.paid_at).toLocaleDateString()}` : null].filter(Boolean).join(" · ") || "No dates recorded yet."}</p>
                    <p>{item.notes || "No notes recorded."}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.settlement_status === "pending_signoff" ? (
                      <RevenueWorkflowDialog
                        title="Agree settlement"
                        description="Confirm the settlement amount and move it into agreed state."
                        actionLabel="Agree settlement"
                        loading={workflowMutation.isPending}
                        fields={[{ key: "notes", label: "Settlement note", type: "textarea" }]}
                        onSubmit={(form) => workflowMutation.mutate({ action: "agree_settlement", settlement_id: item.id, notes: form.notes })}
                      >
                        <Button variant="outline">Agree</Button>
                      </RevenueWorkflowDialog>
                    ) : null}
                    {item.settlement_status === "agreed" ? (
                      <RevenueWorkflowDialog
                        title="Mark settlement paid"
                        description="Record that the settlement has been paid."
                        actionLabel="Mark paid"
                        loading={workflowMutation.isPending}
                        fields={[
                          { key: "received_date", label: "Received date", type: "date" },
                          { key: "notes", label: "Payment note", type: "textarea" }
                        ]}
                        onSubmit={(form) => workflowMutation.mutate({ action: "mark_settlement_paid", settlement_id: item.id, received_date: form.received_date, notes: form.notes })}
                      >
                        <Button variant="outline">Mark paid</Button>
                      </RevenueWorkflowDialog>
                    ) : null}
                  </div>
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="evidence">
            <DataListCard
              title="Revenue evidence"
              items={evidence}
              render={(item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{compactLabel(item.evidence_type)}</p>
                  <p>{item.summary}</p>
                  {item.file_url ? <a className="text-primary underline-offset-4 hover:underline" href={item.file_url} target="_blank" rel="noreferrer">Open evidence</a> : null}
                </div>
              )}
            />
          </TabsContent>

          <TabsContent value="audit">
            <DataListCard
              title="Audit trail"
              items={audit}
              render={(item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{item.summary}</p>
                  <p>{[item.action, item.created_date ? new Date(item.created_date).toLocaleString() : null].filter(Boolean).join(" · ")}</p>
                </div>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <RevenueWorkflowDialog title="Approve entitlement" description="Approve this entitlement and post the accrual entry." actionLabel="Approve" loading={workflowMutation.isPending} fields={[{ key: "notes", label: "Approval note", type: "textarea" }]} onSubmit={(form) => workflowMutation.mutate({ action: "approve_entitlement", notes: form.notes })}><Button variant="outline">Approve entitlement</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Reject entitlement" description="Reject this entitlement and preserve the reversal entry in the ledger." actionLabel="Reject" loading={workflowMutation.isPending} fields={[{ key: "notes", label: "Rejection note", type: "textarea", required: true }]} onSubmit={(form) => workflowMutation.mutate({ action: "reject_entitlement", notes: form.notes })}><Button variant="outline">Reject entitlement</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Create invoice" description="Issue an invoice and open the payout expectation record." actionLabel="Create invoice" loading={workflowMutation.isPending} fields={[{ key: "due_date", label: "Due date", type: "date" }, { key: "notes", label: "Invoice note", type: "textarea" }]} onSubmit={(form) => workflowMutation.mutate({ action: "create_invoice", due_date: form.due_date, notes: form.notes })}><Button variant="outline">Create invoice</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Mark partial payment" description="Record part of the expected payment." actionLabel="Record payment" loading={workflowMutation.isPending} fields={[{ key: "amount", label: "Amount", type: "number", required: true }, { key: "received_date", label: "Received date", type: "date" }, { key: "payment_method", label: "Payment method", type: "select", options: paymentMethodOptions }, { key: "transaction_reference", label: "Transaction reference" }, { key: "notes", label: "Payment note", type: "textarea" }]} onSubmit={(form) => workflowMutation.mutate({ action: "mark_partial_payment", amount: Number(form.amount || 0), received_date: form.received_date, payment_method: form.payment_method, transaction_reference: form.transaction_reference, notes: form.notes })}><Button variant="outline">Mark partial payment</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Mark paid" description="Record full payment and close the outstanding balance." actionLabel="Mark paid" loading={workflowMutation.isPending} fields={[{ key: "amount", label: "Amount", type: "number" }, { key: "received_date", label: "Received date", type: "date" }, { key: "payment_method", label: "Payment method", type: "select", options: paymentMethodOptions }, { key: "transaction_reference", label: "Transaction reference" }, { key: "notes", label: "Payment note", type: "textarea" }]} onSubmit={(form) => workflowMutation.mutate({ action: "mark_paid", amount: Number(form.amount || 0), received_date: form.received_date, payment_method: form.payment_method, transaction_reference: form.transaction_reference, notes: form.notes })}><Button variant="outline">Mark paid</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Open dispute" description="Open a formal commercial dispute on this entitlement." actionLabel="Open dispute" loading={workflowMutation.isPending} fields={[{ key: "dispute_type", label: "Dispute type", type: "select", options: disputeTypeOptions, required: true }, { key: "severity", label: "Severity", type: "select", options: severityOptions, required: true }, { key: "summary", label: "Summary", type: "textarea", required: true }, { key: "notes", label: "Internal note", type: "textarea" }]} initialValues={{ severity: "medium" }} onSubmit={(form) => workflowMutation.mutate({ action: "open_dispute", dispute_type: form.dispute_type, severity: form.severity, summary: form.summary, notes: form.notes })}><Button variant="outline">Open dispute</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Create adjustment" description="Apply an approved amount change and preserve the ledger delta." actionLabel="Apply adjustment" loading={workflowMutation.isPending} fields={[{ key: "amount_delta", label: "Amount delta", type: "number", required: true }, { key: "notes", label: "Reason", type: "textarea", required: true }]} onSubmit={(form) => workflowMutation.mutate({ action: "create_adjustment", amount_delta: Number(form.amount_delta || 0), notes: form.notes })}><Button variant="outline">Create adjustment</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Create clawback" description="Record a clawback without erasing the original commercial history." actionLabel="Apply clawback" loading={workflowMutation.isPending} fields={[{ key: "amount_delta", label: "Clawback amount", type: "number", required: true }, { key: "notes", label: "Clawback reason", type: "textarea", required: true }]} onSubmit={(form) => workflowMutation.mutate({ action: "create_clawback", amount_delta: Number(form.amount_delta || 0), notes: form.notes })}><Button variant="outline">Create clawback</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Reverse entitlement" description="Reverse the entitlement and preserve the debit entry." actionLabel="Reverse" loading={workflowMutation.isPending} fields={[{ key: "notes", label: "Reversal reason", type: "textarea", required: true }]} onSubmit={(form) => workflowMutation.mutate({ action: "reverse", notes: form.notes })}><Button variant="outline">Reverse</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Write off entitlement" description="Write off the remaining balance without deleting commercial history." actionLabel="Write off" loading={workflowMutation.isPending} fields={[{ key: "notes", label: "Write-off reason", type: "textarea", required: true }]} onSubmit={(form) => workflowMutation.mutate({ action: "write_off", notes: form.notes })}><Button variant="outline">Write off</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Create settlement" description="Open a settlement record for a negotiated commercial resolution." actionLabel="Create settlement" loading={workflowMutation.isPending} fields={[{ key: "settlement_type", label: "Settlement type", type: "select", options: settlementTypeOptions, required: true }, { key: "agreed_amount", label: "Agreed amount", type: "number", required: true }, { key: "agreed_at", label: "Agreed date", type: "date" }, { key: "notes", label: "Settlement note", type: "textarea" }]} initialValues={{ settlement_type: "commercial_settlement", agreed_amount: entitlement.net_amount || entitlement.gross_amount || 0 }} onSubmit={(form) => workflowMutation.mutate({ action: "create_settlement", settlement_type: form.settlement_type, agreed_amount: Number(form.agreed_amount || 0), agreed_at: form.agreed_at, notes: form.notes })}><Button variant="outline">Create settlement</Button></RevenueWorkflowDialog>
              <RevenueWorkflowDialog title="Upload evidence" description="Attach revenue evidence or a supporting commercial note." actionLabel="Upload evidence" loading={workflowMutation.isPending} fields={[{ key: "evidence_type", label: "Evidence type", type: "select", options: evidenceTypeOptions, required: true }, { key: "file_url", label: "File URL" }, { key: "summary", label: "Summary", type: "textarea", required: true }]} initialValues={{ evidence_type: "commercial_note" }} onSubmit={(form) => workflowMutation.mutate({ action: "upload_evidence", evidence_type: form.evidence_type, file_url: form.file_url, summary: form.summary })}><Button>Upload evidence</Button></RevenueWorkflowDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
