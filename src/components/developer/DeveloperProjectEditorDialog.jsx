import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const initialForm = {
  name: "",
  slug: "",
  status: "planned",
  handover_date: "",
  price_from: "",
  brochure_url: "",
  floor_plan_url: "",
  amenities: "",
  payment_plan_summary: "",
  publication_status: "draft",
};

function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function DeveloperProjectEditorDialog({ open, onOpenChange, project, loading = false, onSubmit }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) return;
    if (!project) {
      setForm(initialForm);
      return;
    }

    setForm({
      name: project.name || "",
      slug: project.slug || "",
      status: project.status || "planned",
      handover_date: project.handover_date || "",
      price_from: project.price_from ?? "",
      brochure_url: project.brochure_url || "",
      floor_plan_url: project.floor_plan_url || "",
      amenities: Array.isArray(project.amenities) ? project.amenities.join(", ") : "",
      payment_plan_summary: project.payment_plan_summary || "",
      publication_status: project.publication_status || "draft",
    });
  }, [open, project]);

  const handleSubmit = async () => {
    await onSubmit?.({
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      status: form.status,
      handover_date: form.handover_date || undefined,
      price_from: form.price_from === "" ? undefined : Number(form.price_from),
      brochure_url: form.brochure_url.trim(),
      floor_plan_url: form.floor_plan_url.trim(),
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
      payment_plan_summary: form.payment_plan_summary.trim(),
      publication_status: form.publication_status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "Create project"}</DialogTitle>
          <DialogDescription>Projects stay as operational records here; public project publishing remains separately governed.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-project-name">Project name</Label>
            <Input id="developer-project-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Harbour District Residences" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-project-slug">Slug</Label>
            <Input id="developer-project-slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="harbour-district-residences" />
          </div>
          <div className="space-y-2">
            <Label>Project status</Label>
            <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="launched">Launched</SelectItem>
                <SelectItem value="under_construction">Under construction</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-project-handover">Handover date</Label>
            <Input id="developer-project-handover" type="date" value={form.handover_date} onChange={(event) => setForm((current) => ({ ...current, handover_date: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-project-price">Price from (AED)</Label>
            <Input id="developer-project-price" type="number" value={form.price_from} onChange={(event) => setForm((current) => ({ ...current, price_from: event.target.value }))} placeholder="1850000" />
          </div>
          <div className="space-y-2">
            <Label>Publication status</Label>
            <Select value={form.publication_status} onValueChange={(value) => setForm((current) => ({ ...current, publication_status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="under_review">Under review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-project-brochure">Brochure URL</Label>
            <Input id="developer-project-brochure" value={form.brochure_url} onChange={(event) => setForm((current) => ({ ...current, brochure_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-project-floor-plan">Floor plan URL</Label>
            <Input id="developer-project-floor-plan" value={form.floor_plan_url} onChange={(event) => setForm((current) => ({ ...current, floor_plan_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-project-amenities">Amenities</Label>
            <Input id="developer-project-amenities" value={form.amenities} onChange={(event) => setForm((current) => ({ ...current, amenities: event.target.value }))} placeholder="Pool, Gym, Kids club" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-project-payment-plan">Payment plan summary</Label>
            <Textarea id="developer-project-payment-plan" value={form.payment_plan_summary} onChange={(event) => setForm((current) => ({ ...current, payment_plan_summary: event.target.value }))} placeholder="10% on booking, 50% during construction, 40% on handover" className="min-h-28" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.name.trim()}>
            {project ? "Save changes" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
