import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PartnerActionGuidanceCard from "@/components/leads/PartnerActionGuidanceCard";
import PartnerActionFieldset from "@/components/leads/PartnerActionFieldset";

const actionOptions = [
  { value: "accept", label: "Accept assignment" },
  { value: "reject", label: "Reject assignment" },
  { value: "request_reassignment", label: "Request reassignment" },
  { value: "log_contact_attempt", label: "Log contact attempt" },
  { value: "log_callback_booked", label: "Book callback" },
  { value: "log_viewing_booked", label: "Book viewing" },
  { value: "log_viewing_completed", label: "Complete viewing" },
  { value: "mark_won", label: "Mark won" },
  { value: "mark_lost", label: "Mark lost" },
  { value: "mark_invalid", label: "Mark invalid" }
];

export default function PartnerLeadActionPanel({ lead, assignment, loading, onSubmit }) {
  const [form, setForm] = useState({ action: "accept", notes: "", outcome: "call", scheduled_at: "" });
  const selectedAction = useMemo(() => actionOptions.find((item) => item.value === form.action), [form.action]);

  const blockedReason = (() => {
    if (["reject", "request_reassignment", "log_contact_attempt", "log_viewing_completed", "mark_lost", "mark_invalid"].includes(form.action) && !form.notes.trim()) return "Add the required notes before submitting.";
    if (["log_callback_booked", "log_viewing_booked", "log_viewing_completed"].includes(form.action) && !form.scheduled_at) return "Choose the required date and time first.";
    return "";
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Partner action panel</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Select value={form.action} onValueChange={(value) => setForm({ action: value, notes: "", outcome: "call", scheduled_at: "" })}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              {actionOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-background/50 p-3 text-sm">
              <p className="font-medium text-foreground">{selectedAction?.label}</p>
            </div>
            <PartnerActionGuidanceCard action={form.action} />
            <PartnerActionFieldset form={form} setForm={setForm} />
          </div>

          <div className="grid gap-3 rounded-2xl border border-dashed border-white/10 p-3 text-sm text-muted-foreground md:grid-cols-2">
            <p>Status: {lead?.status || "new"}</p>
            <p>Ownership: {lead?.ownership_status || "unowned"}</p>
            <p>Assignment: {assignment?.assignment_status || "pending"}</p>
            <p>SLA: {assignment?.sla_status || "on_track"}</p>
          </div>

          {blockedReason ? <p className="text-sm text-destructive">{blockedReason}</p> : null}

          <Button type="submit" disabled={loading || Boolean(blockedReason)} className="w-full">Run action</Button>
        </form>
      </CardContent>
    </Card>
  );
}