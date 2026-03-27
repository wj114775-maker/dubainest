import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InternalLeadConfirmationDialog from "@/components/leads/InternalLeadConfirmationDialog";
import InternalLeadActionSelector, { actionOptions } from "@/components/leads/InternalLeadActionSelector";
import InternalLeadWorkflowHint from "@/components/leads/InternalLeadWorkflowHint";
import InternalLeadEntitySelector from "@/components/leads/InternalLeadEntitySelector";

export default function InternalLeadActionPanel({ lead, partners = [], duplicates = [], loading, canManage, onSubmit }) {
  const [form, setForm] = useState({ action: "assign", notes: "", partner_id: "", target_lead_id: "", severity: "high" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const selectedAction = useMemo(() => actionOptions.find((item) => item.value === form.action), [form.action]);
  const selectedPartner = partners.find((item) => item.id === form.partner_id);
  const selectedDuplicate = duplicates.find((item) => item.id === form.target_lead_id);

  const partnerOptions = partners.map((item) => ({
    id: item.id,
    label: item.name,
    helper: `Trust score ${item.partner_trust_score ?? "—"} · SLA ${item.sla_response_minutes ?? "—"} mins`
  }));

  const duplicateOptions = duplicates.map((item) => ({
    id: item.id,
    label: item.label,
    helper: `Confidence ${item.confidence}% · ${item.summary}`
  }));

  const selectedPartnerOption = partnerOptions.find((item) => item.id === form.partner_id);
  const selectedDuplicateOption = duplicateOptions.find((item) => item.id === form.target_lead_id);
  const isAssigned = ["assigned", "accepted", "contact_in_progress", "callback_booked", "viewing_booked", "viewing_completed", "offer_in_discussion", "reserved"].includes(lead?.status);
  const isClosed = ["won", "lost", "merged", "blocked"].includes(lead?.status);

  const blockedReason = useMemo(() => {
    if (form.action === "assign" && !form.partner_id) return "Choose a partner first.";
    if (form.action === "merge" && !form.target_lead_id) return "Choose a duplicate target first.";
    if (["release", "merge", "escalate", "flag_circumvention", "mark_duplicate"].includes(form.action) && !form.notes.trim()) return "A reason is required for this action.";
    if (form.action === "assign" && lead?.ownership_status === "protected") return "Protected leads must be released before reassignment.";
    if (form.action === "assign" && isClosed) return "Closed leads cannot be reassigned.";
    if (form.action === "release" && !["locked", "protected"].includes(lead?.ownership_status)) return "Only locked or protected leads can be released.";
    if (form.action === "lock" && lead?.status === "merged") return "Merged leads cannot be locked.";
    if (form.action === "merge" && lead?.status === "merged") return "This lead is already merged.";
    if (form.action === "merge" && !lead?.is_duplicate_candidate) return "Mark this lead as a duplicate candidate before merging.";
    if (form.action === "mark_duplicate" && lead?.status === "merged") return "Merged leads cannot be marked as duplicate.";
    if (form.action === "mark_duplicate" && lead?.is_duplicate_candidate) return "This lead is already in duplicate review.";
    if (form.action === "escalate" && isClosed) return "Closed leads cannot be escalated.";
    if (form.action === "flag_circumvention" && !isAssigned) return "Circumvention review is only for actively handled leads.";
    return "";
  }, [form, lead, isAssigned, isClosed]);

  const requiresConfirmation = ["release", "merge", "flag_circumvention", "escalate"].includes(form.action);

  const confirmationSummary = [
    `Action: ${selectedAction?.label || "Lead action"}`,
    form.partner_id && selectedPartnerOption ? `Partner: ${selectedPartnerOption.label}` : null,
    form.target_lead_id && selectedDuplicateOption ? `Target lead: ${selectedDuplicateOption.label}` : null,
    form.action === "mark_duplicate" ? "Workflow: duplicate review" : null,
    form.severity && ["flag_circumvention", "escalate"].includes(form.action) ? `Severity: ${form.severity}` : null,
    form.notes.trim() ? `Reason: ${form.notes.trim()}` : `Reason: none provided`
  ].filter(Boolean).join(" · ");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (blockedReason) return;
    setConfirmed(false);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    onSubmit(form);
    setConfirmOpen(false);
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Structured lead controls</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <InternalLeadActionSelector value={form.action} onChange={(value) => setForm((current) => ({ ...current, action: value, notes: "", partner_id: "", target_lead_id: "", severity: "high" }))} />

          <InternalLeadWorkflowHint action={form.action} title={selectedAction?.label} />

          {form.action === "assign" ? (
            <InternalLeadEntitySelector
              placeholder="Select partner"
              value={form.partner_id}
              onChange={(value) => setForm((current) => ({ ...current, partner_id: value }))}
              options={partnerOptions}
              helper={selectedPartnerOption?.helper}
            />
          ) : null}

          {form.action === "merge" ? (
            <InternalLeadEntitySelector
              placeholder="Select duplicate target"
              value={form.target_lead_id}
              onChange={(value) => setForm((current) => ({ ...current, target_lead_id: value }))}
              options={duplicateOptions}
              helper={selectedDuplicateOption?.helper}
            />
          ) : null}

          {form.action === "mark_duplicate" ? (
            <div className="rounded-2xl border border-white/10 bg-muted/20 p-3 text-sm text-muted-foreground">
              This starts duplicate review only. It does not merge the lead.
            </div>
          ) : null}

          {form.action === "flag_circumvention" || form.action === "escalate" ? (
            <Select value={form.severity} onValueChange={(value) => setForm((current) => ({ ...current, severity: value }))}>
              <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          ) : null}

          <Textarea placeholder="Reason, evidence or operator note" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />

          <div className="rounded-2xl border border-dashed border-white/10 p-3 text-sm text-muted-foreground">
            <p>Current lead state</p>
            <p className="mt-1">{lead?.status || "new"} · {lead?.current_stage || "new"} · {lead?.ownership_status || "unowned"}</p>
          </div>

          {blockedReason ? <p className="text-sm text-destructive">{blockedReason}</p> : null}

          <Button type="submit" disabled={loading || !canManage || Boolean(blockedReason)} className="w-full">Review action</Button>
        </form>
      </CardContent>
      <InternalLeadConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        actionLabel={selectedAction?.label || "Lead action"}
        summary={confirmationSummary}
        requiresConfirmation={requiresConfirmation}
        confirmed={confirmed}
        onConfirmedChange={setConfirmed}
        loading={loading}
        onConfirm={handleConfirm}
      />
    </Card>
  );
}