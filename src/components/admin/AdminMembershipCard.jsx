import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminMembershipCard({ onCreate }) {
  const [form, setForm] = useState({ user_id: "", organisation_type: "partner_agency", organisation_id: "", membership_type: "agency_admin", status: "active", assignment_scope: "", notes: "" });

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Create organisation membership</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="User ID" />
        <Input value={form.organisation_type} onChange={(e) => setForm({ ...form, organisation_type: e.target.value })} placeholder="Organisation type" />
        <Input value={form.organisation_id} onChange={(e) => setForm({ ...form, organisation_id: e.target.value })} placeholder="Organisation ID" />
        <Input value={form.membership_type} onChange={(e) => setForm({ ...form, membership_type: e.target.value })} placeholder="Membership type" />
        <Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} placeholder="Status" />
        <Input value={form.assignment_scope} onChange={(e) => setForm({ ...form, assignment_scope: e.target.value })} placeholder="Assignment scope" />
        <div className="md:col-span-2">
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
        </div>
        <div className="md:col-span-2">
          <Button onClick={() => onCreate(form)}>Create membership</Button>
        </div>
      </CardContent>
    </Card>
  );
}