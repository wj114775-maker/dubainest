import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminAssignmentCard({ onCreate }) {
  const [form, setForm] = useState({ user_id: "", role_code: "", bundle_codes: "", permission_codes: "", scope_type: "global", scope_id: "", notes: "" });

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Create role assignment</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="User ID" />
        <Input value={form.role_code} onChange={(e) => setForm({ ...form, role_code: e.target.value })} placeholder="Role code" />
        <Input value={form.bundle_codes} onChange={(e) => setForm({ ...form, bundle_codes: e.target.value })} placeholder="Bundle codes comma separated" />
        <Input value={form.permission_codes} onChange={(e) => setForm({ ...form, permission_codes: e.target.value })} placeholder="Permission codes comma separated" />
        <Input value={form.scope_type} onChange={(e) => setForm({ ...form, scope_type: e.target.value })} placeholder="Scope type" />
        <Input value={form.scope_id} onChange={(e) => setForm({ ...form, scope_id: e.target.value })} placeholder="Scope id" />
        <div className="md:col-span-2">
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
        </div>
        <div className="md:col-span-2">
          <Button onClick={() => onCreate(form)}>Create assignment</Button>
        </div>
      </CardContent>
    </Card>
  );
}