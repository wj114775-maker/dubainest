import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { buyerPipelineClosedOutcomes, buyerPipelineStages, compactLabel } from "@/lib/buyerPipeline";
import { conciergeCaseStatusOptions, conciergeCaseTypeOptions, conciergePriorityOptions } from "@/lib/concierge";
import { disputeTypeOptions, formatCurrency, triggerTypeOptions } from "@/lib/revenue";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

const stageOptions = buyerPipelineStages.map((stage) => ({ value: stage.id, label: stage.label }));
const closeOutcomeOptions = buyerPipelineClosedOutcomes.map((value) => ({ value, label: compactLabel(value) }));

function SectionCard({ title, description, children }) {
  return (
    <Card className="rounded-[1.6rem] border-white/10 bg-card/75">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function BuyerCaseDeskDrawer({
  item,
  open,
  onOpenChange,
  partnerOptions = [],
  conciergeUserOptions = []
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [stageForm, setStageForm] = useState({ stage: "capture", outcome_status: "won", notes: "" });
  const [ownerForm, setOwnerForm] = useState({ partner_id: "__unassigned__", concierge_owner_id: "__none__", notes: "" });
  const [premiumForm, setPremiumForm] = useState({
    case_type: "concierge_standard",
    priority: "standard",
    case_status: "intake_in_progress",
    requires_nda: false,
    is_private_inventory: false,
    is_hnw: false,
    is_relocation_case: false,
    is_golden_visa_case: false,
    assigned_concierge_id: "__none__",
    notes: ""
  });
  const [moneyCreateForm, setMoneyCreateForm] = useState({
    event_type: "manual",
    summary: "",
    manual_amount: "",
    deal_value: "",
    partner_commission_amount: "",
    notes: ""
  });
  const [moneyActionForm, setMoneyActionForm] = useState({
    due_date: "",
    amount: "",
    notes: "",
    dispute_type: "fee_amount_dispute",
    dispute_summary: ""
  });

  useEffect(() => {
    if (!item) return;
    setStageForm({
      stage: item.pipeline_stage || "capture",
      outcome_status: ["won", "lost", "blocked"].includes(item.lead.status || "") ? item.lead.status : "won",
      notes: ""
    });
    setOwnerForm({
      partner_id: item.assignment?.partner_id || item.lead.assigned_partner_id || "__unassigned__",
      concierge_owner_id: item.conciergeCase?.assigned_concierge_id || "__none__",
      notes: ""
    });
    setPremiumForm({
      case_type: item.conciergeCase?.case_type || (item.lead.is_private_inventory ? "private_inventory" : item.lead.is_high_value ? "hnw" : "concierge_standard"),
      priority: item.conciergeCase?.priority || (item.lead.is_high_value ? "priority" : "standard"),
      case_status: item.conciergeCase?.case_status || "intake_in_progress",
      requires_nda: Boolean(item.lead.is_private_inventory),
      is_private_inventory: Boolean(item.lead.is_private_inventory),
      is_hnw: Boolean(item.lead.is_high_value),
      is_relocation_case: false,
      is_golden_visa_case: false,
      assigned_concierge_id: item.conciergeCase?.assigned_concierge_id || "__none__",
      notes: ""
    });
    setMoneyCreateForm({
      event_type: "manual",
      summary: `Fee claim for ${item.identityName}`,
      manual_amount: "",
      deal_value: "",
      partner_commission_amount: "",
      notes: ""
    });
    setMoneyActionForm({
      due_date: "",
      amount: "",
      notes: "",
      dispute_type: "fee_amount_dispute",
      dispute_summary: `Commercial query for ${item.identityName}`
    });
  }, [item]);

  const leadMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke("internalManageLead", { lead_id: item.id, ...payload })
  });
  const conciergeMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke("internalManageConciergeCase", { case_id: item.conciergeCase?.id, ...payload })
  });
  const conciergeCreateMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke("openConciergeCase", payload)
  });
  const revenueMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke("internalManageRevenueWorkflow", { entitlement_id: item.latestRevenue?.id, ...payload })
  });
  const revenueCreateMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke("createRevenueEntitlement", payload)
  });

  const isBusy = leadMutation.isPending || conciergeMutation.isPending || conciergeCreateMutation.isPending || revenueMutation.isPending || revenueCreateMutation.isPending;

  const activePartnerId = ownerForm.partner_id !== "__unassigned__" ? ownerForm.partner_id : "";
  const activeConciergeId = premiumForm.assigned_concierge_id !== "__none__" ? premiumForm.assigned_concierge_id : "";
  const conciergeLabel = conciergeUserOptions.find((option) => option.id === activeConciergeId)?.label || "No premium owner";

  const refreshAll = async () => {
    const keys = [
      ["ops-leads-registry"],
      ["ops-dashboard-data"],
      ["ops-concierge-workspace"],
      ["ops-revenue-workspace"],
      ["notifications-inbox"],
      ["ops-audit-feed"],
      ["ops-lead-detail", item.id]
    ];
    if (item.conciergeCase?.id) keys.push(["ops-concierge-detail", item.conciergeCase.id]);
    if (item.latestRevenue?.id) keys.push(["ops-revenue-detail", item.latestRevenue.id]);
    await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };

  const runAction = async (executor, title, description) => {
    try {
      await executor();
      await refreshAll();
      toast({ title, description });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error?.message || "The workflow update could not be completed.",
        variant: "destructive"
      });
    }
  };

  const suggestedMoneyAction = useMemo(() => {
    const status = item?.latestRevenue?.entitlement_status || "";
    if (["draft", "pending_review"].includes(status)) return "approve";
    if (status === "approved") return "invoice";
    if (["invoiced", "awaiting_payment", "partially_paid"].includes(status)) return "collect";
    if (status === "disputed") return "resolve_dispute";
    return "";
  }, [item]);

  if (!item) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto border-white/10 bg-background/95 p-0 sm:max-w-2xl">
        <div className="min-h-full bg-[radial-gradient(circle_at_top_right,rgba(42,157,143,0.18),transparent_26%),radial-gradient(circle_at_top_left,rgba(233,196,106,0.14),transparent_30%)]">
          <div className="space-y-6 p-6">
            <SheetHeader className="space-y-3 pr-10">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{item.stageLabel}</Badge>
                <Badge variant="outline">{item.lead.lead_code || item.id}</Badge>
                {item.conciergeCase ? <Badge variant="outline">Premium linked</Badge> : null}
                {item.latestRevenue ? <Badge variant="outline">Money linked</Badge> : null}
              </div>
              <SheetTitle className="text-2xl tracking-tight">{item.identityName}</SheetTitle>
              <SheetDescription>{item.intentLabel}</SheetDescription>
            </SheetHeader>

            <Card className="rounded-[1.8rem] border-white/10 bg-card/80">
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Current owner</p>
                  <p className="mt-2 font-medium">{item.ownerLabel}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Premium owner</p>
                  <p className="mt-2 font-medium">{item.conciergeCase ? item.conciergeOwnerLabel || conciergeLabel : "No premium case yet"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live signal</p>
                  <p className="mt-2 font-medium">{item.liveSignal}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <SectionCard
                title="Stage"
                description="Move the buyer case through the business workflow without leaving the board."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Business stage">
                    <Select value={stageForm.stage} onValueChange={(value) => setStageForm((current) => ({ ...current, stage: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent>
                        {stageOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  {stageForm.stage === "closed" ? (
                    <Field label="Closed outcome">
                      <Select value={stageForm.outcome_status} onValueChange={(value) => setStageForm((current) => ({ ...current, outcome_status: value }))}>
                        <SelectTrigger><SelectValue placeholder="Choose outcome" /></SelectTrigger>
                        <SelectContent>
                          {closeOutcomeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                  ) : null}
                </div>
                <Field label="Operator note" hint="Optional, but useful for audit clarity.">
                  <Textarea value={stageForm.notes} onChange={(event) => setStageForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Why is this case moving now?" />
                </Field>
                <Button
                  disabled={isBusy}
                  onClick={() => runAction(
                    () => leadMutation.mutateAsync({
                      action: "update_stage",
                      stage: stageForm.stage,
                      outcome_status: stageForm.stage === "closed" ? stageForm.outcome_status : undefined,
                      notes: stageForm.notes
                    }),
                    "Stage updated",
                    `${item.identityName} moved to ${compactLabel(stageForm.stage)}.`
                  )}
                >
                  Save stage
                </Button>
              </SectionCard>
              <SectionCard
                title="Owner"
                description="Control the buyer handoff and premium owner without dropping into a separate detail page."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Partner owner">
                    <Select value={ownerForm.partner_id} onValueChange={(value) => setOwnerForm((current) => ({ ...current, partner_id: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__unassigned__">No partner selected</SelectItem>
                        {partnerOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Partner note">
                    <Textarea value={ownerForm.notes} onChange={(event) => setOwnerForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Reason for assignment or re-route" />
                  </Field>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={isBusy || ownerForm.partner_id === "__unassigned__" || ownerForm.partner_id === (item.assignment?.partner_id || item.lead.assigned_partner_id || "")}
                    onClick={() => runAction(
                      () => leadMutation.mutateAsync({
                        action: item.assignment?.partner_id || item.lead.assigned_partner_id ? "reassign" : "assign",
                        partner_id: ownerForm.partner_id,
                        notes: ownerForm.notes || "Updated from buyer board drawer."
                      }),
                      "Partner owner updated",
                      `${item.identityName} is now routed to ${partnerOptions.find((option) => option.id === ownerForm.partner_id)?.label || ownerForm.partner_id}.`
                    )}
                  >
                    Save partner owner
                  </Button>
                </div>

                <Separator className="bg-white/10" />

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Premium owner" hint={item.conciergeCase ? "Only active premium cases can be reassigned here." : "Open a premium case first to assign a concierge owner."}>
                    <Select
                      value={ownerForm.concierge_owner_id}
                      onValueChange={(value) => {
                        setOwnerForm((current) => ({ ...current, concierge_owner_id: value }));
                        setPremiumForm((current) => ({ ...current, assigned_concierge_id: value }));
                      }}
                      disabled={!item.conciergeCase}
                    >
                      <SelectTrigger><SelectValue placeholder="Select concierge owner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">No premium owner</SelectItem>
                        {conciergeUserOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      disabled={isBusy || !item.conciergeCase || ownerForm.concierge_owner_id === "__none__" || ownerForm.concierge_owner_id === (item.conciergeCase?.assigned_concierge_id || "")}
                      onClick={() => runAction(
                        () => conciergeMutation.mutateAsync({
                          action: "assign_concierge",
                          assigned_concierge_id: ownerForm.concierge_owner_id,
                          assigned_internal_team: item.conciergeCase?.assigned_internal_team || "concierge"
                        }),
                        "Premium owner updated",
                        `${conciergeUserOptions.find((option) => option.id === ownerForm.concierge_owner_id)?.label || ownerForm.concierge_owner_id} now owns the premium case.`
                      )}
                    >
                      Save premium owner
                    </Button>
                  </div>
                </div>
              </SectionCard>
              <SectionCard
                title="Premium state"
                description={item.conciergeCase ? "Update the linked premium case from here." : "Open a premium case when this buyer needs private, concierge, or HNW handling."}
              >
                {item.conciergeCase ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Premium status">
                        <Select value={premiumForm.case_status} onValueChange={(value) => setPremiumForm((current) => ({ ...current, case_status: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            {conciergeCaseStatusOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Priority">
                        <Select value={premiumForm.priority} onValueChange={(value) => setPremiumForm((current) => ({ ...current, priority: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                          <SelectContent>
                            {conciergePriorityOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field label="Premium note">
                      <Textarea value={premiumForm.notes} onChange={(event) => setPremiumForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Update summary for the premium handling team" />
                    </Field>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={isBusy}
                        onClick={() => runAction(
                          async () => {
                            if (premiumForm.case_status !== item.conciergeCase?.case_status) {
                              await conciergeMutation.mutateAsync({
                                action: "update_status",
                                case_status: premiumForm.case_status
                              });
                            }
                            if (premiumForm.priority !== item.conciergeCase?.priority) {
                              await conciergeMutation.mutateAsync({
                                action: "change_priority",
                                priority: premiumForm.priority
                              });
                            }
                            if (premiumForm.notes.trim()) {
                              await conciergeMutation.mutateAsync({
                                action: "add_note",
                                note_type: "internal_update",
                                visibility: "internal_only",
                                content: premiumForm.notes
                              });
                            }
                          },
                          "Premium state updated",
                          `${item.identityName} premium workflow was updated.`
                        )}
                      >
                        Save premium state
                      </Button>
                      <Button variant="outline" asChild>
                        <Link to={`/ops/concierge/${item.conciergeCase.id}`}>Open full premium case</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Case type">
                        <Select value={premiumForm.case_type} onValueChange={(value) => setPremiumForm((current) => ({ ...current, case_type: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select case type" /></SelectTrigger>
                          <SelectContent>
                            {conciergeCaseTypeOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Priority">
                        <Select value={premiumForm.priority} onValueChange={(value) => setPremiumForm((current) => ({ ...current, priority: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                          <SelectContent>
                            {conciergePriorityOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-background/45 p-3 text-sm">
                        <Checkbox checked={premiumForm.requires_nda} onCheckedChange={(value) => setPremiumForm((current) => ({ ...current, requires_nda: Boolean(value) }))} />
                        NDA required
                      </label>
                      <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-background/45 p-3 text-sm">
                        <Checkbox checked={premiumForm.is_private_inventory} onCheckedChange={(value) => setPremiumForm((current) => ({ ...current, is_private_inventory: Boolean(value) }))} />
                        Private inventory
                      </label>
                      <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-background/45 p-3 text-sm">
                        <Checkbox checked={premiumForm.is_hnw} onCheckedChange={(value) => setPremiumForm((current) => ({ ...current, is_hnw: Boolean(value) }))} />
                        HNW handling
                      </label>
                      <label className="flex items-center gap-3 rounded-[1rem] border border-white/10 bg-background/45 p-3 text-sm">
                        <Checkbox checked={premiumForm.is_golden_visa_case} onCheckedChange={(value) => setPremiumForm((current) => ({ ...current, is_golden_visa_case: Boolean(value) }))} />
                        Golden Visa support
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Assign concierge">
                        <Select value={premiumForm.assigned_concierge_id} onValueChange={(value) => setPremiumForm((current) => ({ ...current, assigned_concierge_id: value }))}>
                          <SelectTrigger><SelectValue placeholder="Optional concierge owner" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Assign later</SelectItem>
                            {conciergeUserOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Premium note">
                        <Textarea value={premiumForm.notes} onChange={(event) => setPremiumForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Why does this buyer need premium handling?" />
                      </Field>
                    </div>
                    <Button
                      disabled={isBusy}
                      onClick={() => runAction(
                        () => conciergeCreateMutation.mutateAsync({
                          lead_id: item.id,
                          case_type: premiumForm.case_type,
                          priority: premiumForm.priority,
                          summary: premiumForm.notes || `Premium case opened from buyer board for ${item.identityName}.`,
                          assigned_concierge_id: premiumForm.assigned_concierge_id !== "__none__" ? premiumForm.assigned_concierge_id : "",
                          is_private_inventory: premiumForm.is_private_inventory,
                          is_hnw: premiumForm.is_hnw,
                          is_relocation_case: premiumForm.is_relocation_case,
                          is_golden_visa_case: premiumForm.is_golden_visa_case,
                          requires_nda: premiumForm.requires_nda,
                          source: "internal"
                        }),
                        "Premium case opened",
                        `${item.identityName} now has a linked premium workflow.`
                      )}
                    >
                      Open premium case
                    </Button>
                  </>
                )}
              </SectionCard>
              <SectionCard
                title="Money state"
                description={item.latestRevenue ? "Advance the linked fee claim from review to settlement." : "Open the commercial record when this buyer is ready for fee tracking."}
              >
                {item.latestRevenue ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="rounded-[1rem] border border-white/10 bg-background/45 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Claim status</p>
                        <p className="mt-2 font-medium">{compactLabel(item.latestRevenue.entitlement_status)}</p>
                      </div>
                      <div className="rounded-[1rem] border border-white/10 bg-background/45 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Claim amount</p>
                        <p className="mt-2 font-medium">{formatCurrency(item.latestRevenue.net_amount || item.latestRevenue.gross_amount || 0, item.latestRevenue.currency || "AED")}</p>
                      </div>
                      <div className="rounded-[1rem] border border-white/10 bg-background/45 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Linked invoice</p>
                        <p className="mt-2 font-medium">{item.latestInvoice ? compactLabel(item.latestInvoice.invoice_status) : "Not issued"}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-[1rem] border border-white/10 bg-background/45 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Payout state</p>
                        <p className="mt-2 font-medium">{item.latestPayout ? compactLabel(item.latestPayout.payout_status) : "No payout yet"}</p>
                      </div>
                      <div className="rounded-[1rem] border border-white/10 bg-background/45 p-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dispute state</p>
                        <p className="mt-2 font-medium">{item.latestDispute ? compactLabel(item.latestDispute.status) : "No dispute open"}</p>
                      </div>
                    </div>

                    {suggestedMoneyAction === "approve" ? (
                      <div className="space-y-4">
                        <Field label="Approval note">
                          <Textarea value={moneyActionForm.notes} onChange={(event) => setMoneyActionForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Why is this claim approved?" />
                        </Field>
                        <Button
                          disabled={isBusy}
                          onClick={() => runAction(
                            () => revenueMutation.mutateAsync({ action: "approve_entitlement", notes: moneyActionForm.notes }),
                            "Claim approved",
                            `${item.identityName} is ready for invoicing.`
                          )}
                        >
                          Approve claim
                        </Button>
                      </div>
                    ) : null}

                    {suggestedMoneyAction === "invoice" ? (
                      <div className="space-y-4">
                        <Field label="Invoice due date">
                          <Input type="date" value={moneyActionForm.due_date} onChange={(event) => setMoneyActionForm((current) => ({ ...current, due_date: event.target.value }))} />
                        </Field>
                        <Field label="Invoice note">
                          <Textarea value={moneyActionForm.notes} onChange={(event) => setMoneyActionForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Anything finance should preserve on the invoice?" />
                        </Field>
                        <Button
                          disabled={isBusy}
                          onClick={() => runAction(
                            () => revenueMutation.mutateAsync({ action: "create_invoice", due_date: moneyActionForm.due_date, notes: moneyActionForm.notes }),
                            "Invoice created",
                            `${item.identityName} now has an issued commercial record.`
                          )}
                        >
                          Issue invoice
                        </Button>
                      </div>
                    ) : null}

                    {suggestedMoneyAction === "collect" ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Payment amount">
                            <Input type="number" value={moneyActionForm.amount} onChange={(event) => setMoneyActionForm((current) => ({ ...current, amount: event.target.value }))} placeholder="0" />
                          </Field>
                          <Field label="Collection note">
                            <Textarea value={moneyActionForm.notes} onChange={(event) => setMoneyActionForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Payment or settlement note" />
                          </Field>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            disabled={isBusy || !moneyActionForm.amount}
                            onClick={() => runAction(
                              () => revenueMutation.mutateAsync({
                                action: "mark_partial_payment",
                                amount: Number(moneyActionForm.amount || 0),
                                notes: moneyActionForm.notes
                              }),
                              "Payment recorded",
                              `${item.identityName} has a new payment entry.`
                            )}
                          >
                            Record payment
                          </Button>
                          <Button
                            variant="outline"
                            disabled={isBusy}
                            onClick={() => runAction(
                              () => revenueMutation.mutateAsync({
                                action: "mark_paid",
                                amount: Number(moneyActionForm.amount || 0),
                                notes: moneyActionForm.notes
                              }),
                              "Claim marked paid",
                              `${item.identityName} is now commercially settled.`
                            )}
                          >
                            Mark paid in full
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {suggestedMoneyAction === "resolve_dispute" ? (
                      <div className="space-y-4">
                        <Field label="Resolution note">
                          <Textarea value={moneyActionForm.notes} onChange={(event) => setMoneyActionForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Explain the commercial resolution." />
                        </Field>
                        <Button
                          disabled={isBusy || !item.latestDispute}
                          onClick={() => runAction(
                            () => revenueMutation.mutateAsync({ action: "resolve_dispute", dispute_id: item.latestDispute?.id, notes: moneyActionForm.notes }),
                            "Dispute resolved",
                            `${item.identityName} has moved out of commercial dispute.`
                          )}
                        >
                          Resolve dispute
                        </Button>
                      </div>
                    ) : null}

                    {item.latestRevenue.entitlement_status !== "disputed" ? (
                      <>
                        <Separator className="bg-white/10" />
                        <div className="space-y-4">
                          <p className="text-sm font-medium">Open a dispute</p>
                          <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Dispute type">
                              <Select value={moneyActionForm.dispute_type} onValueChange={(value) => setMoneyActionForm((current) => ({ ...current, dispute_type: value }))}>
                                <SelectTrigger><SelectValue placeholder="Select dispute type" /></SelectTrigger>
                                <SelectContent>
                                  {disputeTypeOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </Field>
                            <Field label="Summary">
                              <Textarea value={moneyActionForm.dispute_summary} onChange={(event) => setMoneyActionForm((current) => ({ ...current, dispute_summary: event.target.value }))} placeholder="Describe the commercial issue." />
                            </Field>
                          </div>
                          <Button
                            variant="outline"
                            disabled={isBusy || !moneyActionForm.dispute_summary.trim()}
                            onClick={() => runAction(
                              () => revenueMutation.mutateAsync({
                                action: "open_dispute",
                                dispute_type: moneyActionForm.dispute_type,
                                severity: "medium",
                                summary: moneyActionForm.dispute_summary,
                                notes: moneyActionForm.notes
                              }),
                              "Dispute opened",
                              `${item.identityName} now has a tracked commercial dispute.`
                            )}
                          >
                            Open dispute
                          </Button>
                        </div>
                      </>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/ops/revenue/${item.latestRevenue.id}`}>Open full money record</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Trigger type">
                        <Select value={moneyCreateForm.event_type} onValueChange={(value) => setMoneyCreateForm((current) => ({ ...current, event_type: value }))}>
                          <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                          <SelectContent>
                            {triggerTypeOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Summary">
                        <Textarea value={moneyCreateForm.summary} onChange={(event) => setMoneyCreateForm((current) => ({ ...current, summary: event.target.value }))} placeholder="What commercial event happened?" />
                      </Field>
                      <Field label="Manual amount">
                        <Input type="number" value={moneyCreateForm.manual_amount} onChange={(event) => setMoneyCreateForm((current) => ({ ...current, manual_amount: event.target.value }))} placeholder="Optional" />
                      </Field>
                      <Field label="Partner commission amount">
                        <Input type="number" value={moneyCreateForm.partner_commission_amount} onChange={(event) => setMoneyCreateForm((current) => ({ ...current, partner_commission_amount: event.target.value }))} placeholder="Optional" />
                      </Field>
                      <Field label="Deal value">
                        <Input type="number" value={moneyCreateForm.deal_value} onChange={(event) => setMoneyCreateForm((current) => ({ ...current, deal_value: event.target.value }))} placeholder="Optional" />
                      </Field>
                    </div>
                    <Field label="Commercial note">
                      <Textarea value={moneyCreateForm.notes} onChange={(event) => setMoneyCreateForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Anything finance should preserve on creation." />
                    </Field>
                    <Button
                      disabled={isBusy || !moneyCreateForm.summary.trim() || !activePartnerId}
                      onClick={() => runAction(
                        () => revenueCreateMutation.mutateAsync({
                          lead_id: item.id,
                          partner_id: activePartnerId,
                          event_type: moneyCreateForm.event_type,
                          event_date: new Date().toISOString(),
                          summary: moneyCreateForm.summary,
                          manual_amount: Number(moneyCreateForm.manual_amount || 0),
                          partner_commission_amount: Number(moneyCreateForm.partner_commission_amount || 0),
                          deal_value: Number(moneyCreateForm.deal_value || 0),
                          listing_type: item.lead.is_private_inventory ? "private_inventory" : "",
                          is_private_inventory: Boolean(item.lead.is_private_inventory),
                          is_high_value: Boolean(item.lead.is_high_value),
                          buyer_type: item.conciergeCase ? "concierge" : "",
                          lead_type: item.lead.intent_type || item.lead.source || "",
                          trigger_source: "board_drawer"
                        }),
                        "Fee claim created",
                        `${item.identityName} now has a governed commercial record.`
                      )}
                    >
                      Create fee claim
                    </Button>
                    {!activePartnerId ? <p className="text-sm text-muted-foreground">Assign a partner owner first, then open the fee claim.</p> : null}
                  </>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
