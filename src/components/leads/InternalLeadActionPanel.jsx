import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InternalLeadConfirmationDialog from "@/components/leads/InternalLeadConfirmationDialog";

const actionOptions = [
  { value: "assign", label: "Assign / reassign" },
  { value: "mark_duplicate", label: "Mark duplicate" },
  { value: "merge", label: "Merge lead" },
  { value: "lock", label: "Lock protection" },
  { value: "release", label: "Release protection" },
  { value: "flag_circumvention", label: "Open alert" },
  { value: "escalate", label: "Escalate" }
];

export default function InternalLeadActionPanel({ lead, partners = [], duplicates = [], loading, canManage, onSubmit }) {
  const [form, setForm] = useState({ action: "assign", notes: "", partner_id: "", target_lead_id: "", severity: "high" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const selectedAction = useMemo(() => actionOptions.find((item) => item.value === form.action), [form.action]);
  const selectedPartner = partners.find((item) => item.id === form.partner_id);
  const selectedDuplicate = duplicates.find((item) => item.id === form.target_lead_id);

  const helperText = {
    assign: "Pick a partner and record the handoff reason.",
    mark_duplicate: "Flag this lead for duplicate review without merging it yet.",
    merge: "Choose a reviewed duplicate target before merging.",
    lock: "Start or extend the current protection window.",
    release: "Release current protection on the lead.",
    flag_circumvention: "Open a circumvention case with severity and evidence.",
    escalate: "Escalate this lead for higher-priority handling."
  };

  const blockedReason = useMemo(() => {
    if (form.action === "assign" && !form.partner_id) return "Choose a partner first.";
    if (form.action === "merge" && !form.target_lead_id) return "Choose a duplicate target first.";
    if (["release", "merge", "escalate", "flag_circumvention"].includes(form.action) && !form.notes.trim()) return "A reason is required for this action.";
    if (form.action === "assign" && lead?.ownership_status === "protected") return "Protected leads must be released before reassignment.";
    if (form.action === "release" && !["locked", "protected"].includes(lead?.ownership_status)) return "Only locked or protected leads can be released.";
    if (form.action === "lock" && lead?.status === "merged") return "Merged leads cannot be locked.";
    if (form.action === "merge" && lead?.status === "merged") return "This lead is already merged.";
    if (form.action === "mark_duplicate" && lead?.status === "merged") return "Merged leads cannot be marked as duplicate.";
    return "";
  }, [form, lead]);

  const requiresConfirmation = ["release", "merge", "flag_circumvention", "escalate"].includes(form.action);

  const confirmationSummary = [
    `Action: ${selectedAction?.label || "Lead action"}`,
    form.partner_id && selectedPartner ? `Partner: ${selectedPartner.name}` : null,
    form.target_lead_id && selectedDuplicate ? `Target lead: ${selectedDuplicate.label}` : null,
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
          <Select value={form.action} onValueChange={(value) => setForm((current) => ({ ...current, action: value, notes: "", partner_id: "", target_lead_id: "", severity: "high" }))}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              {actionOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="rounded-2xl border border-white/10 bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{selectedAction?.label}</p>
            <p className="mt-1">{helperText[form.action]}</p>
          </div>

          {form.action === "assign" ? (
            <div className="space-y-3">
              <Select value={form.partner_id} onValueChange={(value) => setForm((current) => ({ ...current, partner_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                <SelectContent>
                  {partners.map((partner) => <SelectItem key={partner.id} value={partner.id}>{partner.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedPartner ? <p className="text-sm text-muted-foreground">Trust score {selectedPartner.partner_trust_score ?? "—"} · SLA {selectedPartner.sla_response_minutes ?? "—"} mins</p> : null}
            </div>
          ) : null}

          {form.action === "merge" ? (
            <div className="space-y-3">
              <Select value={form.target_lead_id} onValueChange={(value) => setForm((current) => ({ ...current, target_lead_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Select duplicate target" /></SelectTrigger>
                <SelectContent>
                  {duplicates.map((candidate) => <SelectItem key={candidate.id} value={candidate.id}>{candidate.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {selectedDuplicate ? <p className="text-sm text-muted-foreground">Confidence {selectedDuplicate.confidence}% · {selectedDuplicate.summary}</p> : null}
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