import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const initialForm = { title: "", slug: "", category: "investing", status: "draft", excerpt: "", body: "" };

export default function AdminGuideFormCard({ guide, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(guide ? {
      title: guide.title || "",
      slug: guide.slug || "",
      category: guide.category || "investing",
      status: guide.status || "draft",
      excerpt: guide.excerpt || "",
      body: guide.body || ""
    } : initialForm);
  }, [guide]);

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{guide ? "Edit guide" : "Create guide"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Guide title" />
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug" />
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" />
          <Input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} placeholder="Status" />
          <div className="md:col-span-2">
            <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Excerpt" />
          </div>
          <div className="md:col-span-2">
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Guide body" className="min-h-[220px]" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => onSubmit(form)}>{guide ? "Save guide" : "Create guide"}</Button>
          {guide ? <Button variant="outline" onClick={onCancel}>Cancel</Button> : null}
        </div>
      </CardContent>
    </Card>
  );
}