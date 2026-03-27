import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const channelOptions = ["call", "whatsapp", "email", "sms", "meeting", "other"];
const lossReasons = ["budget", "timing", "location", "competitor", "not_interested", "other"];
const invalidReasons = ["duplicate", "fake", "unreachable", "out_of_scope", "other"];

export default function PartnerActionFieldset({ form, setForm }) {
  if (["accept", "reject", "request_reassignment", "mark_won"].includes(form.action)) {
    return <Textarea placeholder="Notes or reason" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />;
  }

  if (form.action === "log_contact_attempt") {
    return (
      <div className="space-y-3">
        <Select value={form.outcome} onValueChange={(value) => setForm((current) => ({ ...current, outcome: value }))}>
          <SelectTrigger><SelectValue placeholder="Contact channel" /></SelectTrigger>
          <SelectContent>{channelOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
        <Textarea placeholder="Attempt result and evidence" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
      </div>
    );
  }

  if (["log_callback_booked", "log_viewing_booked", "log_viewing_completed"].includes(form.action)) {
    return (
      <div className="space-y-3">
        <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((current) => ({ ...current, scheduled_at: e.target.value }))} />
        <Textarea placeholder={form.action === "log_viewing_completed" ? "Viewing outcome and notes" : "Booking notes"} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
      </div>
    );
  }

  if (form.action === "mark_lost") {
    return (
      <div className="space-y-3">
        <Select value={form.outcome} onValueChange={(value) => setForm((current) => ({ ...current, outcome: value }))}>
          <SelectTrigger><SelectValue placeholder="Loss reason" /></SelectTrigger>
          <SelectContent>{lossReasons.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
        <Textarea placeholder="Loss details" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
      </div>
    );
  }

  if (form.action === "mark_invalid") {
    return (
      <div className="space-y-3">
        <Select value={form.outcome} onValueChange={(value) => setForm((current) => ({ ...current, outcome: value }))}>
          <SelectTrigger><SelectValue placeholder="Invalid reason" /></SelectTrigger>
          <SelectContent>{invalidReasons.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
        <Textarea placeholder="Why this lead is invalid" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
      </div>
    );
  }

  return <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />;
}