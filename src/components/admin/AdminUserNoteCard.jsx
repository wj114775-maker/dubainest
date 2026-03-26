import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AdminUserNoteCard({ onAdd }) {
  const [form, setForm] = useState({ targetUserId: "", note: "", visibility: "internal", category: "general" });

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Add account note</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input value={form.targetUserId} onChange={(e) => setForm({ ...form, targetUserId: e.target.value })} placeholder="User ID" />
        <Input value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} placeholder="Visibility" />
        <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
        <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Internal note" />
        <Button onClick={() => onAdd(form)}>Save note</Button>
      </CardContent>
    </Card>
  );
}