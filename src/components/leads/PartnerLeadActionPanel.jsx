import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const channelOptions = ["call", "whatsapp", "email", "sms", "meeting", "other"];

export default function PartnerLeadActionPanel({ lead, assignment, loading, onSubmit }) {
  const [form, setForm] = useState({ action: "accept", notes: "", outcome: "call", scheduled_at: "" });
  const selectedAction = useMemo(() => actionOptions.find((item) => item.value === form.action), [form.action]);

  const helperText = {
    accept: "Accept and lock this lead to your team.",
    reject: "Reject this lead back to internal routing with a clear reason.",
    request_reassignment: "Ask for reassignment when fit, capacity or geography is wrong.",
    log_contact_attempt: "Record contact channel, outcome and evidence.",
    log_callback_booked: "Schedule a callback and move the lead forward.",
    log_viewing_booked: "Schedule the viewing date and time.",
    log_viewing_completed: "Confirm the viewing result and what happened next.",
    mark_won: "Use only when the lead has converted.",
    mark_lost: "Record the loss reason clearly.",
    mark_invalid: "Use for invalid or unworkable leads."
  };

  const requiresSchedule = ["log_callback_booked", "log_viewing_booked", "log_viewing_completed"].includes(form.action);
  const requiresChannel = ["log_contact_attempt", "log_callback_booked"].includes(form.action);

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

          <div className="rounded-2xl border border-white/10 bg-muted/30 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{selectedAction?.label}</p>
            <p className="mt-1">{helperText[form.action]}</p>
          </div>

          {requiresSchedule ? <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((current) => ({ ...current, scheduled_at: e.target.value }))} /> : null}

          {requiresChannel ? (
            <Select value={form.outcome} onValueChange={(value) => setForm((current) => ({ ...current, outcome: value }))}>
              <SelectTrigger><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                {channelOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : null}

          <Textarea placeholder="Notes, evidence or outcome summary" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />

          <div className="grid gap-3 rounded-2xl border border-dashed border-white/10 p-3 text-sm text-muted-foreground md:grid-cols-2">
            <p>Status: {lead?.status || "new"}</p>
            <p>Ownership: {lead?.ownership_status || "unowned"}</p>
            <p>Assignment: {assignment?.assignment_status || "pending"}</p>
            <p>SLA: {assignment?.sla_status || "on_track"}</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full">Run action</Button>
        </form>
      </CardContent>
    </Card>
  );
}