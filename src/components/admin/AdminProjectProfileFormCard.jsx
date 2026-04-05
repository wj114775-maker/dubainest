import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { slugifyText } from "@/lib/developerDirectory";
import ProjectRecordPicker from "@/components/admin/ProjectRecordPicker";

const initialForm = {
  project_id: "",
  project_name: "",
  slug: "",
  developer_profile_slug: "",
  developer_name: "",
  page_status: "draft",
  show_on_homepage: false,
  primary_city: "Dubai",
  area_name: "",
  project_status_override: "",
  handover_label_override: "",
  starting_price_override: "",
  headline: "",
  summary: "",
  body: "",
  hero_image_url: "",
  gallery_image_urls_text: "",
  brochure_url: "",
  floor_plan_url: "",
  payment_plan_summary: "",
  unit_types_text: "",
  bedroom_range: "",
  amenity_highlights_text: "",
  featured_listing_ids_text: "",
  contact_email: "",
  contact_phone: "",
  seo_title: "",
  seo_description: "",
  notes: "",
};

function toForm(profile) {
  return {
    project_id: profile?.project_id || "",
    project_name: profile?.project_name || "",
    slug: profile?.slug || "",
    developer_profile_slug: profile?.developer_profile_slug || "",
    developer_name: profile?.developer_name || "",
    page_status: profile?.page_status || "draft",
    show_on_homepage: Boolean(profile?.show_on_homepage),
    primary_city: profile?.primary_city || "Dubai",
    area_name: profile?.area_name || "",
    project_status_override: profile?.project_status_override || "",
    handover_label_override: profile?.handover_label_override || "",
    starting_price_override: profile?.starting_price_override ?? "",
    headline: profile?.headline || "",
    summary: profile?.summary || "",
    body: profile?.body || "",
    hero_image_url: profile?.hero_image_url || "",
    gallery_image_urls_text: Array.isArray(profile?.gallery_image_urls) ? profile.gallery_image_urls.join(", ") : "",
    brochure_url: profile?.brochure_url || "",
    floor_plan_url: profile?.floor_plan_url || "",
    payment_plan_summary: profile?.payment_plan_summary || "",
    unit_types_text: Array.isArray(profile?.unit_types) ? profile.unit_types.join(", ") : "",
    bedroom_range: profile?.bedroom_range || "",
    amenity_highlights_text: Array.isArray(profile?.amenity_highlights) ? profile.amenity_highlights.join(", ") : "",
    featured_listing_ids_text: Array.isArray(profile?.featured_listing_ids) ? profile.featured_listing_ids.join(", ") : "",
    contact_email: profile?.contact_email || "",
    contact_phone: profile?.contact_phone || "",
    seo_title: profile?.seo_title || "",
    seo_description: profile?.seo_description || "",
    notes: profile?.notes || "",
  };
}

export default function AdminProjectProfileFormCard({ profile, projects = [], developerProfiles = [], onSubmit, onCancel, disabled = false }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(profile ? toForm(profile) : initialForm);
  }, [profile]);

  const selectedProject = useMemo(
    () => projects.find((projectRecord) => projectRecord.id === form.project_id) || null,
    [form.project_id, projects]
  );

  const applyProjectSource = (projectId) => {
    const match = projects.find((projectRecord) => projectRecord.id === projectId);
    if (!match) {
      setForm((current) => ({ ...current, project_id: "" }));
      return;
    }

    setForm((current) => ({
      ...current,
      project_id: match.id,
      project_name: current.project_name || match.name || "",
      slug: current.slug || slugifyText(match.slug || match.name),
      project_status_override: current.project_status_override || match.status || "",
      handover_label_override: current.handover_label_override || match.handover_date || "",
      starting_price_override: current.starting_price_override || match.price_from || "",
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      ...form,
      slug: slugifyText(form.slug || form.project_name),
      starting_price_override: form.starting_price_override ? Number(form.starting_price_override) : undefined,
      gallery_image_urls: form.gallery_image_urls_text.split(",").map((item) => item.trim()).filter(Boolean),
      unit_types: form.unit_types_text.split(",").map((item) => item.trim()).filter(Boolean),
      amenity_highlights: form.amenity_highlights_text.split(",").map((item) => item.trim()).filter(Boolean),
      featured_listing_ids: form.featured_listing_ids_text.split(",").map((item) => item.trim()).filter(Boolean),
    });
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>{profile ? "Edit project page" : "Create project page"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Operational project source</Label>
          <ProjectRecordPicker value={form.project_id} onChange={applyProjectSource} projects={projects} />
          <p className="text-xs text-muted-foreground">Link the public page to an internal project record when one exists. You can still manage the public project page even if the operational project is not fully mapped yet.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Public project name</Label>
            <Input
              value={form.project_name}
              onChange={(event) => setForm((current) => ({
                ...current,
                project_name: event.target.value,
                slug: current.slug || slugifyText(event.target.value),
              }))}
              placeholder="Project display name"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="project-slug" />
          </div>
          <div className="space-y-2">
            <Label>Linked developer page</Label>
            <Select value={form.developer_profile_slug || "__none__"} onValueChange={(value) => setForm((current) => ({ ...current, developer_profile_slug: value === "__none__" ? "" : value }))}>
              <SelectTrigger><SelectValue placeholder="Linked developer page" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No linked developer page</SelectItem>
                {developerProfiles.map((developer) => (
                  <SelectItem key={developer.id} value={developer.slug}>{developer.developer_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Developer name</Label>
            <Input value={form.developer_name} onChange={(event) => setForm((current) => ({ ...current, developer_name: event.target.value }))} placeholder="Developer name" />
          </div>
          <div className="space-y-2">
            <Label>Page status</Label>
            <Select value={form.page_status} onValueChange={(value) => setForm((current) => ({ ...current, page_status: value }))}>
              <SelectTrigger><SelectValue placeholder="Page status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project status</Label>
            <Select value={form.project_status_override || "__auto__"} onValueChange={(value) => setForm((current) => ({ ...current, project_status_override: value === "__auto__" ? "" : value }))}>
              <SelectTrigger><SelectValue placeholder="Project status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__auto__">Use source project status</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="launched">Launched</SelectItem>
                <SelectItem value="under_construction">Under construction</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Primary city</Label>
            <Input value={form.primary_city} onChange={(event) => setForm((current) => ({ ...current, primary_city: event.target.value }))} placeholder="Dubai" />
          </div>
          <div className="space-y-2">
            <Label>Area name</Label>
            <Input value={form.area_name} onChange={(event) => setForm((current) => ({ ...current, area_name: event.target.value }))} placeholder="Area or community" />
          </div>
          <div className="space-y-2">
            <Label>Handover label</Label>
            <Input value={form.handover_label_override} onChange={(event) => setForm((current) => ({ ...current, handover_label_override: event.target.value }))} placeholder="Q4 2028 or TBC" />
          </div>
          <div className="space-y-2">
            <Label>Starting price</Label>
            <Input value={form.starting_price_override} onChange={(event) => setForm((current) => ({ ...current, starting_price_override: event.target.value }))} placeholder="2500000" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Headline</Label>
            <Input value={form.headline} onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value }))} placeholder="Short headline for the public project page" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Summary</Label>
            <Textarea value={form.summary} onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))} placeholder="Short project summary" className="min-h-[96px]" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Body</Label>
            <Textarea value={form.body} onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))} placeholder="Full project page body" className="min-h-[180px]" />
          </div>
          <div className="space-y-2">
            <Label>Hero image URL</Label>
            <Input value={form.hero_image_url} onChange={(event) => setForm((current) => ({ ...current, hero_image_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Gallery image URLs</Label>
            <Input value={form.gallery_image_urls_text} onChange={(event) => setForm((current) => ({ ...current, gallery_image_urls_text: event.target.value }))} placeholder="Comma-separated image URLs" />
          </div>
          <div className="space-y-2">
            <Label>Brochure URL</Label>
            <Input value={form.brochure_url} onChange={(event) => setForm((current) => ({ ...current, brochure_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2">
            <Label>Floor plan URL</Label>
            <Input value={form.floor_plan_url} onChange={(event) => setForm((current) => ({ ...current, floor_plan_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Payment plan summary</Label>
            <Textarea value={form.payment_plan_summary} onChange={(event) => setForm((current) => ({ ...current, payment_plan_summary: event.target.value }))} placeholder="For example: 20% on booking, 40% during construction, 40% on handover." className="min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label>Unit types</Label>
            <Input value={form.unit_types_text} onChange={(event) => setForm((current) => ({ ...current, unit_types_text: event.target.value }))} placeholder="Apartment, Penthouse, Townhouse" />
          </div>
          <div className="space-y-2">
            <Label>Bedroom range</Label>
            <Input value={form.bedroom_range} onChange={(event) => setForm((current) => ({ ...current, bedroom_range: event.target.value }))} placeholder="1-4" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Amenity highlights</Label>
            <Input value={form.amenity_highlights_text} onChange={(event) => setForm((current) => ({ ...current, amenity_highlights_text: event.target.value }))} placeholder="Lagoon pool, wellness club, branded concierge" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Featured listing ids</Label>
            <Input value={form.featured_listing_ids_text} onChange={(event) => setForm((current) => ({ ...current, featured_listing_ids_text: event.target.value }))} placeholder="demo-city-walk-penthouse, listing_123" />
          </div>
          <div className="space-y-2">
            <Label>Contact email</Label>
            <Input value={form.contact_email} onChange={(event) => setForm((current) => ({ ...current, contact_email: event.target.value }))} placeholder="projects@dubaisphere.com" />
          </div>
          <div className="space-y-2">
            <Label>Contact phone</Label>
            <Input value={form.contact_phone} onChange={(event) => setForm((current) => ({ ...current, contact_phone: event.target.value }))} placeholder="+971..." />
          </div>
          <div className="space-y-2">
            <Label>SEO title</Label>
            <Input value={form.seo_title} onChange={(event) => setForm((current) => ({ ...current, seo_title: event.target.value }))} placeholder="SEO title override" />
          </div>
          <div className="space-y-2">
            <Label>SEO description</Label>
            <Input value={form.seo_description} onChange={(event) => setForm((current) => ({ ...current, seo_description: event.target.value }))} placeholder="SEO description override" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Internal notes</Label>
            <Textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Internal notes for approvals, source material, or launch timing." className="min-h-[110px]" />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-background/60 px-4 py-3">
          <div>
            <p className="font-medium text-foreground">Show on homepage</p>
            <p className="text-xs text-muted-foreground">Use this only for priority launches or flagship projects.</p>
          </div>
          <Switch checked={form.show_on_homepage} onCheckedChange={(checked) => setForm((current) => ({ ...current, show_on_homepage: checked }))} />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={disabled}>{profile ? "Save project page" : "Create project page"}</Button>
          {profile ? <Button variant="outline" onClick={onCancel}>Cancel</Button> : null}
          {selectedProject?.name ? <span className="self-center text-xs text-muted-foreground">Linked source: {selectedProject.name}</span> : null}
        </div>
        {disabled ? (
          <p className="text-xs text-amber-700">ProjectProfile is not published in the live Base44 app yet.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
