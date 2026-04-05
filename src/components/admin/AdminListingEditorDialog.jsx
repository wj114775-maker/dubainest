import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const initialForm = {
  title: "",
  description: "",
  listing_type: "sale",
  property_type: "",
  price: "",
  bedrooms: "",
  bathrooms: "",
  built_up_area_sqft: "",
  hero_image_url: "",
  status: "draft",
  publication_status: "draft",
  is_private_inventory: false,
};

const toNumberOrUndefined = (value) => (value === "" ? undefined : Number(value));

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function AdminListingEditorDialog({ open, onOpenChange, listing, loading, onSubmit }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) return;
    setForm(listing ? {
      title: listing.title || "",
      description: listing.description || "",
      listing_type: listing.listing_type === "private_inventory" ? "private_inventory" : "sale",
      property_type: listing.property_type || "",
      price: listing.price ?? "",
      bedrooms: listing.bedrooms ?? "",
      bathrooms: listing.bathrooms ?? "",
      built_up_area_sqft: listing.built_up_area_sqft ?? "",
      hero_image_url: listing.hero_image_url || "",
      status: listing.status || "draft",
      publication_status: listing.publication_status || "draft",
      is_private_inventory: Boolean(listing.is_private_inventory),
    } : initialForm);
  }, [listing, open]);

  const handleSubmit = async () => {
    await onSubmit?.({
      title: form.title.trim(),
      slug: slugify(form.title),
      description: form.description.trim(),
      listing_type: form.listing_type,
      property_type: form.property_type.trim(),
      price: Number(form.price || 0),
      bedrooms: toNumberOrUndefined(form.bedrooms),
      bathrooms: toNumberOrUndefined(form.bathrooms),
      built_up_area_sqft: toNumberOrUndefined(form.built_up_area_sqft),
      hero_image_url: form.hero_image_url.trim(),
      status: form.status,
      publication_status: form.publication_status,
      is_private_inventory: form.is_private_inventory || form.listing_type === "private_inventory",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle>{listing ? "Edit listing" : "Add listing"}</DialogTitle>
          <DialogDescription>
            Use this page to keep the core inventory table simple. Advanced review still lives in the listing detail page.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="admin-listing-title">Title</Label>
            <Input id="admin-listing-title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="City Walk penthouse" />
          </div>
          <div className="space-y-2">
            <Label>Listing type</Label>
            <Select value={form.listing_type} onValueChange={(value) => setForm((current) => ({ ...current, listing_type: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">Sale</SelectItem>
                <SelectItem value="private_inventory">Private inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-listing-property-type">Property type</Label>
            <Input id="admin-listing-property-type" value={form.property_type} onChange={(event) => setForm((current) => ({ ...current, property_type: event.target.value }))} placeholder="Apartment" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-listing-price">Price (AED)</Label>
            <Input id="admin-listing-price" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} placeholder="2500000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-listing-bedrooms">Bedrooms</Label>
            <Input id="admin-listing-bedrooms" type="number" value={form.bedrooms} onChange={(event) => setForm((current) => ({ ...current, bedrooms: event.target.value }))} placeholder="2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-listing-bathrooms">Bathrooms</Label>
            <Input id="admin-listing-bathrooms" type="number" value={form.bathrooms} onChange={(event) => setForm((current) => ({ ...current, bathrooms: event.target.value }))} placeholder="3" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-listing-area">Built-up area (sqft)</Label>
            <Input id="admin-listing-area" type="number" value={form.built_up_area_sqft} onChange={(event) => setForm((current) => ({ ...current, built_up_area_sqft: event.target.value }))} placeholder="1450" />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under review</SelectItem>
                <SelectItem value="verification_pending">Verification pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Publication</Label>
            <Select value={form.publication_status} onValueChange={(value) => setForm((current) => ({ ...current, publication_status: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="eligible">Eligible</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
                <SelectItem value="frozen">Frozen</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="admin-listing-hero-image">Hero image URL</Label>
            <Input id="admin-listing-hero-image" value={form.hero_image_url} onChange={(event) => setForm((current) => ({ ...current, hero_image_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="admin-listing-description">Description</Label>
            <Textarea id="admin-listing-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the listing for internal use and the public page." className="min-h-32" />
          </div>
          <div className="flex items-center gap-3 md:col-span-2">
            <Checkbox id="admin-listing-private" checked={form.is_private_inventory} onCheckedChange={(value) => setForm((current) => ({ ...current, is_private_inventory: Boolean(value) }))} />
            <Label htmlFor="admin-listing-private">Mark as private inventory</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !form.title.trim() || !String(form.price).trim()}>
            {listing ? "Save listing" : "Add listing"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
