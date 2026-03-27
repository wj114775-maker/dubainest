import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const channelOptions = ["call", "whatsapp", "email", "sms", "meeting", "other"];

export default function PartnerContactActionFields({ form, setForm }) {
  if (form.action === "log_contact_attempt") {
    return (
      <div className="space-y-3">
        <Select value={form.outcome} onValueChange={(value) => setForm((current) => ({ ...current, outcome: value }))}>
          <SelectTrigger><SelectValue placeholder="Contact channel" /></SelectTrigger>
          <SelectContent>{channelOptions.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
        </Select>
        <Textarea placeholder="What happened during the contact attempt?" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((current) => ({ ...current, scheduled_at: e.target.value }))} />
      <Textarea placeholder="Callback context, expectations, or instructions" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
    </div>
  );
}