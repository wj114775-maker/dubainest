import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const actionOptions = [
  { value: "lock", label: "Lock" },
  { value: "release", label: "Release" },
  { value: "assign", label: "Assign" },
  { value: "mark_duplicate", label: "Mark duplicate" },
  { value: "escalate", label: "Escalate" },
  { value: "flag_circumvention", label: "Flag circumvention" },
  { value: "merge", label: "Merge" }
];

export default function InternalLeadActionsCard({ onSubmit, loading }) {
  const [form, setForm] = useState({ action: "lock", notes: "", partner_id: "", target_lead_id: "", severity: "high" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Internal lead controls</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Select value={form.action} onValueChange={(value) => setForm({ ...form, action: value })}>
            <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
            <SelectContent>
              {actionOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Partner id" value={form.partner_id} onChange={(e) => setForm({ ...form, partner_id: e.target.value })} />
          <Input placeholder="Target lead id" value={form.target_lead_id} onChange={(e) => setForm({ ...form, target_lead_id: e.target.value })} />
          <Select value={form.severity} onValueChange={(value) => setForm({ ...form, severity: value })}>
            <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Textarea placeholder="Notes or override reason" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Button type="submit" disabled={loading}>Apply action</Button>
        </form>
      </CardContent>
    </Card>
  );
}