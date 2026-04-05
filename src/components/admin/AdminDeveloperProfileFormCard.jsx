import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import DeveloperPicker from "@/components/buyer/DeveloperPicker";
import { slugifyText } from "@/lib/developerDirectory";

const initialForm = {
  developer_name: "",
  approved_developer_name: "",
  office_number: "",
  slug: "",
  partnership_status: "not_partnered",
  page_status: "draft",
  show_on_homepage: false,
  headline: "",
  summary: "",
  body: "",
  hero_image_url: "",
  logo_url: "",
  primary_city: "Dubai",
  featured_areas_text: "",
  brand_color: "",
  contact_email: "",
  contact_phone: "",
  notes: "",
};

function toForm(profile) {
  return {
    developer_name: profile?.developer_name || "",
    approved_developer_name: profile?.approved_developer_name || "",
    office_number: profile?.office_number || "",
    slug: profile?.slug || "",
    partnership_status: profile?.partnership_status || "not_partnered",
    page_status: profile?.page_status || "draft",
    show_on_homepage: Boolean(profile?.show_on_homepage),
    headline: profile?.headline || "",
    summary: profile?.summary || "",
    body: profile?.body || "",
    hero_image_url: profile?.hero_image_url || "",
    logo_url: profile?.logo_url || "",
    primary_city: profile?.primary_city || "Dubai",
    featured_areas_text: Array.isArray(profile?.featured_areas) ? profile.featured_areas.join(", ") : "",
    brand_color: profile?.brand_color || "",
    contact_email: profile?.contact_email || "",
    contact_phone: profile?.contact_phone || "",
    notes: profile?.notes || "",
  };
}

function buildDeveloperOptions(approvedDevelopers = []) {
  return approvedDevelopers.map((developer) => ({
    ...developer,
    value: developer.englishName,
  }));
}

export default function AdminDeveloperProfileFormCard({ profile, approvedDevelopers = [], onSubmit, onCancel, disabled = false }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    setForm(profile ? toForm(profile) : initialForm);
  }, [profile]);

  const developerOptions = useMemo(() => buildDeveloperOptions(approvedDevelopers), [approvedDevelopers]);

  const canShowOnHomepage = form.partnership_status === "partnered" && form.page_status === "published";

  const applyApprovedDeveloper = (value) => {
    if (value === "all") {
      setForm((current) => ({
        ...current,
        approved_developer_name: "",
        office_number: "",
      }));
      return;
    }

    const match = approvedDevelopers.find((developer) => developer.englishName === value);
    if (!match) return;

    setForm((current) => ({
      ...current,
      developer_name: current.developer_name || match.displayName || match.englishName,
      approved_developer_name: match.englishName,
      office_number: match.officeNumber || "",
      slug: current.slug || slugifyText(match.displayName || match.englishName),
      logo_url: current.logo_url || match.logoUrl || "",
      contact_email: current.contact_email || match.email || "",
      contact_phone: current.contact_phone || match.phoneNumber || "",
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      ...form,
      slug: slugifyText(form.slug || form.developer_name || form.approved_developer_name),
      show_on_homepage: canShowOnHomepage ? form.show_on_homepage : false,
      featured_areas: form.featured_areas_text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>{profile ? "Edit developer page" : "Create developer page"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Approved developer source</Label>
          <DeveloperPicker
            value={form.approved_developer_name || "all"}
            onChange={applyApprovedDeveloper}
            developers={developerOptions}
            placeholder="Search approved developers"
            triggerClassName="h-11 w-full rounded-[1rem]"
            contentClassName="w-[420px]"
          />
          <p className="text-xs text-muted-foreground">Choose from the official approved-developer list, then tailor the public page with your own branded summary and visibility rules.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Public developer name</Label>
            <Input
              value={form.developer_name}
              onChange={(event) => setForm((current) => ({
                ...current,
                developer_name: event.target.value,
                slug: current.slug || slugifyText(event.target.value),
              }))}
              placeholder="Developer display name"
            />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              placeholder="developer-slug"
            />
          </div>
          <div className="space-y-2">
            <Label>Approved developer name</Label>
            <Input
              value={form.approved_developer_name}
              onChange={(event) => setForm((current) => ({ ...current, approved_developer_name: event.target.value }))}
              placeholder="Official DLD developer name"
            />
          </div>
          <div className="space-y-2">
            <Label>Office number</Label>
            <Input
              value={form.office_number}
              onChange={(event) => setForm((current) => ({ ...current, office_number: event.target.value }))}
              placeholder="Developer office number"
            />
          </div>
          <div className="space-y-2">
            <Label>Partnership status</Label>
            <Select value={form.partnership_status} onValueChange={(value) => setForm((current) => ({ ...current, partnership_status: value }))}>
              <SelectTrigger><SelectValue placeholder="Partnership status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="not_partnered">Not partnered</SelectItem>
                <SelectItem value="partnered">Partnered</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
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
            <Label>Primary city</Label>
            <Input
              value={form.primary_city}
              onChange={(event) => setForm((current) => ({ ...current, primary_city: event.target.value }))}
              placeholder="Dubai"
            />
          </div>
          <div className="space-y-2">
            <Label>Brand color</Label>
            <Input
              value={form.brand_color}
              onChange={(event) => setForm((current) => ({ ...current, brand_color: event.target.value }))}
              placeholder="#0f172a"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Headline</Label>
            <Input
              value={form.headline}
              onChange={(event) => setForm((current) => ({ ...current, headline: event.target.value }))}
              placeholder="Short headline for the public developer page"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Summary</Label>
            <Textarea
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              placeholder="Short summary for cards, previews, and the top of the page"
              className="min-h-[96px]"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Body</Label>
            <Textarea
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              placeholder="Full developer page body"
              className="min-h-[180px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Hero image URL</Label>
            <Input
              value={form.hero_image_url}
              onChange={(event) => setForm((current) => ({ ...current, hero_image_url: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={form.logo_url}
              onChange={(event) => setForm((current) => ({ ...current, logo_url: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Contact email</Label>
            <Input
              value={form.contact_email}
              onChange={(event) => setForm((current) => ({ ...current, contact_email: event.target.value }))}
              placeholder="developer@dubaisphere.com"
            />
          </div>
          <div className="space-y-2">
            <Label>Contact phone</Label>
            <Input
              value={form.contact_phone}
              onChange={(event) => setForm((current) => ({ ...current, contact_phone: event.target.value }))}
              placeholder="+971..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Featured areas</Label>
            <Input
              value={form.featured_areas_text}
              onChange={(event) => setForm((current) => ({ ...current, featured_areas_text: event.target.value }))}
              placeholder="Downtown Dubai, Dubai Hills Estate, Palm Jumeirah"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Internal notes</Label>
            <Textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Internal partnership or page notes"
              className="min-h-[110px]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-background/60 px-4 py-3">
          <div>
            <p className="font-medium text-foreground">Show on homepage</p>
            <p className="text-xs text-muted-foreground">Only enabled when the developer is both partnered and the page is published.</p>
          </div>
          <Switch
            checked={canShowOnHomepage ? form.show_on_homepage : false}
            onCheckedChange={(checked) => setForm((current) => ({ ...current, show_on_homepage: checked }))}
            disabled={!canShowOnHomepage}
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={disabled}>{profile ? "Save developer page" : "Create developer page"}</Button>
          {profile ? <Button variant="outline" onClick={onCancel}>Cancel</Button> : null}
        </div>
        {disabled ? (
          <p className="text-xs text-amber-700">DeveloperProfile is not published in the live Base44 app yet.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
