import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const viewingOutcomes = ["completed", "client_no_show", "broker_no_show", "reschedule_needed", "follow_up_required"];

export default function PartnerViewingActionFields({ form, setForm }) {
  if (form.action === "log_viewing_booked") {
    return (
      <div className="space-y-3">
        <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((current) => ({ ...current, scheduled_at: e.target.value }))} />
        <Textarea placeholder="Viewing logistics, meeting point, or preparation notes" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((current) => ({ ...current, scheduled_at: e.target.value }))} />
      <Select value={form.outcome} onValueChange={(value) => setForm((current) => ({ ...current, outcome: value }))}>
        <SelectTrigger><SelectValue placeholder="Viewing outcome" /></SelectTrigger>
        <SelectContent>{viewingOutcomes.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea placeholder="Viewing notes, buyer reaction, and follow-up plan" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
    </div>
  );
}