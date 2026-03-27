import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const actionOptions = [
  { value: "accept", label: "Accept" },
  { value: "reject", label: "Reject" },
  { value: "request_reassignment", label: "Request reassignment" },
  { value: "log_contact_attempt", label: "Log contact attempt" },
  { value: "log_callback_booked", label: "Log callback booked" },
  { value: "log_viewing_booked", label: "Log viewing booked" },
  { value: "log_viewing_completed", label: "Log viewing completed" },
  { value: "mark_won", label: "Mark won" },
  { value: "mark_lost", label: "Mark lost" },
  { value: "mark_invalid", label: "Mark invalid" }
];

export default function LeadActionComposer({ onSubmit, loading }) {
  const [form, setForm] = useState({ action: "accept", notes: "", outcome: "call", scheduled_at: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Partner lead action</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Select value={form.action} onValueChange={(value) => setForm({ ...form, action: value })}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              {actionOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          <Input placeholder="Outcome channel" value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
          <Textarea placeholder="Notes or evidence" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" disabled={loading}>Run action</Button>
        </form>
      </CardContent>
    </Card>
  );
}