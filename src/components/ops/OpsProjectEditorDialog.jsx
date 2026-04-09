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
  developer_organisation_id: "unassigned",
  status: "planned",
  handover_date: "",
  price_from: "",
  brochure_url: "",
  floor_plan_url: "",
  amenities: "",
  payment_plan_summary: "",
  publication_status: "draft",
  request_review_status: "none",
};

function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OpsProjectEditorDialog({
  open,
  onOpenChange,
  project,
  organisations = [],
  loading = false,
  onSubmit,
}) {
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
      developer_organisation_id: project.developer_organisation_id || project.developer_id || "unassigned",
      status: project.status || "planned",
      handover_date: project.handover_date || "",
      price_from: project.price_from ?? "",
      brochure_url: project.brochure_url || "",
      floor_plan_url: project.floor_plan_url || "",
      amenities: Array.isArray(project.amenities) ? project.amenities.join(", ") : "",
      payment_plan_summary: project.payment_plan_summary || "",
      publication_status: project.publication_status || "draft",
      request_review_status: project.request_review_status || "none",
    });
  }, [open, project]);

  const handleSubmit = async () => {
    const developerId = form.developer_organisation_id === "unassigned" ? "" : form.developer_organisation_id;
    await onSubmit?.({
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      developer_organisation_id: developerId,
      developer_id: developerId,
      status: form.status,
      handover_date: form.handover_date || undefined,
      price_from: form.price_from === "" ? undefined : Number(form.price_from),
      brochure_url: form.brochure_url.trim(),
      floor_plan_url: form.floor_plan_url.trim(),
      amenities: form.amenities.split(",").map((item) => item.trim()).filter(Boolean),
      payment_plan_summary: form.payment_plan_summary.trim(),
      publication_status: form.publication_status,
      request_review_status: form.request_review_status,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "Create project"}</DialogTitle>
          <DialogDescription>
            Internal project records drive inventory ownership and deal linkage. Public project pages stay separately governed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ops-project-name">Project name</Label>
            <Input id="ops-project-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Harbour District Residences" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ops-project-slug">Slug</Label>
            <Input id="ops-project-slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="harbour-district-residences" />
          </div>
          <div className="space-y-2">
            <Label>Developer</Label>
            <Select value={form.developer_organisation_id} onValueChange={(value) => setForm((current) => ({ ...current, developer_organisation_id: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {organisations.map((organisation) => (
                  <SelectItem key={organisation.id} value={organisation.id}>
                    {organisation.trading_name || organisation.legal_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
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
            <Label htmlFor="ops-project-handover">Handover date</Label>
            <Input id="ops-project-handover" type="date" value={form.handover_date} onChange={(event) => setForm((current) => ({ ...current, handover_date: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ops-project-price">Price from (AED)</Label>
            <Input id="ops-project-price" type="number" value={form.price_from} onChange={(event) => setForm((current) => ({ ...current, price_from: event.target.value }))} placeholder="1850000" />
          </div>
          <div className="space-y-2">
            <Label>Publication</Label>
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
          <div className="space-y-2">
            <Label>Review status</Label>
            <Select value={form.request_review_status} onValueChange={(value) => setForm((current) => ({ ...current, request_review_status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="changes_requested">Changes requested</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ops-project-brochure">Brochure URL</Label>
            <Input id="ops-project-brochure" value={form.brochure_url} onChange={(event) => setForm((current) => ({ ...current, brochure_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ops-project-floor-plan">Floor plan URL</Label>
            <Input id="ops-project-floor-plan" value={form.floor_plan_url} onChange={(event) => setForm((current) => ({ ...current, floor_plan_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ops-project-amenities">Amenities</Label>
            <Input id="ops-project-amenities" value={form.amenities} onChange={(event) => setForm((current) => ({ ...current, amenities: event.target.value }))} placeholder="Pool, Gym, Kids club" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="ops-project-payment-plan">Payment plan summary</Label>
            <Textarea id="ops-project-payment-plan" value={form.payment_plan_summary} onChange={(event) => setForm((current) => ({ ...current, payment_plan_summary: event.target.value }))} className="min-h-28" placeholder="10% on booking, 50% during construction, 40% on handover" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.name.trim()}>
            {project ? "Save project" : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
