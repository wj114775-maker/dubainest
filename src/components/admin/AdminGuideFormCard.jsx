import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} placeholder="Guide title" />
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug" />
          <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="investing">Investing</SelectItem>
              <SelectItem value="relocation">Relocation</SelectItem>
              <SelectItem value="golden_visa">Golden Visa</SelectItem>
              <SelectItem value="schools">Schools</SelectItem>
              <SelectItem value="tax">Tax</SelectItem>
            </SelectContent>
          </Select>
          <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
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