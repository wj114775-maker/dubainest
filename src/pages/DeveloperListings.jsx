import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import PartnerListingEditorDialog from "@/components/partner/PartnerListingEditorDialog";
import PartnerListingResponseDialog from "@/components/partner/PartnerListingResponseDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import useDeveloperPortalWorkspace from "@/hooks/useDeveloperPortalWorkspace";
import { createEntitySafe, updateEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, formatCurrency } from "@/lib/revenue";

function slugify(value = "") {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractListingPayload(listing) {
  return {
    title: listing.title,
    slug: slugify(listing.title),
    description: listing.description || "",
    listing_type: listing.listing_type || "sale",
    property_type: listing.property_type || "",
    price: Number(listing.price || 0),
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    built_up_area_sqft: listing.built_up_area_sqft,
    hero_image_url: listing.hero_image_url || "",
    project_id: listing.project_id || undefined,
    is_private_inventory: Boolean(listing.is_private_inventory),
  };
}

export default function DeveloperListings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: workspace, current } = useDeveloperPortalWorkspace();
  const [editorOpen, setEditorOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);
  const [responseMode, setResponseMode] = useState("response");
  const [activeListing, setActiveListing] = useState(null);

  const projectNameById = useMemo(() => Object.fromEntries(workspace.projects.map((project) => [project.id, project.name])), [workspace.projects]);

  const saveListing = useMutation({
    mutationFn: async (payload) => {
      const isLiveListing = Boolean(activeListing?.id) && activeListing.publication_status === "published";
      if (isLiveListing) {
        const result = await createEntitySafe("DeveloperListingRevision", {
          developer_organisation_id: workspace.organisation.id,
          listing_id: activeListing.id,
          project_id: payload.project_id || activeListing.project_id,
          requested_by_user_id: current?.user?.id,
          change_type: "live_update",
          review_status: "submitted",
          ...payload,
          submitted_at: new Date().toISOString(),
          notes: "Developer submitted a governed live listing update.",
        });
        if (!result.ok) {
          throw result.error || new Error("Listing revision failed");
        }
        return result.data;
      }

      const result = activeListing?.id
        ? await updateEntitySafe("Listing", activeListing.id, payload)
        : await createEntitySafe("Listing", {
          ...payload,
          developer_organisation_id: workspace.organisation.id,
          developer_id: workspace.organisation.id,
          status: "draft",
          publication_status: "draft",
          last_refreshed_at: new Date().toISOString(),
        });

      if (!result.ok) {
        throw result.error || new Error("Listing save failed");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      setEditorOpen(false);
      setActiveListing(null);
      toast({
        title: activeListing?.publication_status === "published" ? "Listing update submitted for review" : "Listing saved",
      });
    },
    onError: () => {
      toast({ title: "Listing save failed", variant: "destructive" });
    },
  });

  const listingAction = useMutation({
    mutationFn: async ({ listing, action }) => {
      const now = new Date().toISOString();
      if (action === "duplicate") {
        const result = await createEntitySafe("Listing", {
          ...extractListingPayload(listing),
          title: `${listing.title} Copy`,
          slug: slugify(`${listing.title}-copy`),
          developer_organisation_id: workspace.organisation.id,
          developer_id: workspace.organisation.id,
          status: "draft",
          publication_status: "draft",
          last_refreshed_at: now,
        });
        if (!result.ok) throw result.error || new Error("Duplicate failed");
        return result.data;
      }

      if (action === "archive" && listing.publication_status === "published") {
        const result = await createEntitySafe("DeveloperListingRevision", {
          developer_organisation_id: workspace.organisation.id,
          listing_id: listing.id,
          project_id: listing.project_id,
          requested_by_user_id: current?.user?.id,
          change_type: "archive_request",
          review_status: "submitted",
          title: listing.title,
          submitted_at: now,
          notes: "Developer requested listing archive from the live record.",
        });
        if (!result.ok) throw result.error || new Error("Archive request failed");
        return result.data;
      }

      const updatePayload = action === "archive"
        ? { status: "archived", publication_status: "archived" }
        : action === "submit"
          ? { status: "submitted", publication_status: listing.publication_status || "draft" }
          : action === "refresh"
            ? { status: "submitted", last_refreshed_at: now }
            : {};

      const result = await updateEntitySafe("Listing", listing.id, updatePayload);
      if (!result.ok) throw result.error || new Error("Listing action failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      toast({ title: "Listing updated" });
    },
    onError: () => {
      toast({ title: "Listing action failed", variant: "destructive" });
    },
  });

  const reviewResponse = useMutation({
    mutationFn: async ({ listing, notes, evidenceUrl, resubmit, mode }) => {
      const now = new Date().toISOString();
      const revisionResult = await createEntitySafe("DeveloperListingRevision", {
        developer_organisation_id: workspace.organisation.id,
        listing_id: listing.id,
        project_id: listing.project_id,
        requested_by_user_id: current?.user?.id,
        change_type: "live_update",
        review_status: "submitted",
        title: listing.title,
        description: listing.description || "",
        listing_type: listing.listing_type || "sale",
        property_type: listing.property_type || "",
        price: Number(listing.price || 0),
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        built_up_area_sqft: listing.built_up_area_sqft,
        hero_image_url: listing.hero_image_url || "",
        submitted_at: now,
        notes: `${mode === "response" ? "Issue response" : "Evidence upload"}: ${notes}`,
      });
      if (!revisionResult.ok) throw revisionResult.error || new Error("Issue response failed");

      if (evidenceUrl) {
        const documentResult = await createEntitySafe("SecureDocument", {
          case_id: workspace.organisation.id,
          developer_organisation_id: workspace.organisation.id,
          listing_id: listing.id,
          project_id: listing.project_id,
          document_type: "shared_request_doc",
          title: `${listing.title} issue evidence`,
          file_url: evidenceUrl,
          visibility: "partner_visible",
          uploaded_by: current?.user?.id,
          uploaded_at: now,
          notes,
        });
        if (!documentResult.ok) throw documentResult.error || new Error("Evidence upload failed");
      }

      const updateResult = await updateEntitySafe("Listing", listing.id, {
        status: resubmit ? "submitted" : "under_review",
        last_refreshed_at: now,
      });
      if (!updateResult.ok) throw updateResult.error || new Error("Listing review update failed");
      return revisionResult.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      setResponseOpen(false);
      setActiveListing(null);
      toast({ title: "Issue response submitted" });
    },
    onError: () => {
      toast({ title: "Issue response failed", variant: "destructive" });
    },
  });

  if (!workspace.organisation) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Developer portal" title="Listings" description="Listing access is available after a developer organisation has been linked to your account." />
        <EmptyStateCard title="No developer organisation linked" description="Ask the internal team to complete your portal setup first." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Developer portal"
        title="Listings"
        description="Create new stock directly. If a listing is already live, edits create a governed revision request instead of overwriting the public record."
        action={<Button onClick={() => { setActiveListing(null); setEditorOpen(true); }} disabled={!workspace.capabilities.canEditListings}>Create listing</Button>}
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Listing registry</CardTitle></CardHeader>
        <CardContent>
          {workspace.listings.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publication</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-xs text-muted-foreground">{compactLabel(listing.property_type)} · {compactLabel(listing.listing_type)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{projectNameById[listing.project_id] || "Standalone"}</TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(listing.status)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(listing.publication_status || "draft")}</Badge></TableCell>
                    <TableCell>{formatCurrency(listing.price || 0)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setActiveListing(listing); setEditorOpen(true); }} disabled={!workspace.capabilities.canEditListings}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => listingAction.mutate({ listing, action: "duplicate" })} disabled={listingAction.isPending || !workspace.capabilities.canEditListings}>Duplicate</Button>
                        <Button variant="outline" size="sm" onClick={() => listingAction.mutate({ listing, action: "refresh" })} disabled={listingAction.isPending || !workspace.capabilities.canEditListings}>Refresh</Button>
                        <Button variant="outline" size="sm" onClick={() => listingAction.mutate({ listing, action: "submit" })} disabled={listingAction.isPending || !workspace.capabilities.canEditListings}>Submit</Button>
                        <Button variant="outline" size="sm" onClick={() => { setActiveListing(listing); setResponseMode("response"); setResponseOpen(true); }} disabled={!workspace.capabilities.canEditListings}>Respond</Button>
                        <Button variant="outline" size="sm" onClick={() => { setActiveListing(listing); setResponseMode("evidence"); setResponseOpen(true); }} disabled={!workspace.capabilities.canEditListings}>Evidence</Button>
                        <Button variant="outline" size="sm" onClick={() => listingAction.mutate({ listing, action: "archive" })} disabled={listingAction.isPending || !workspace.capabilities.canEditListings}>Archive</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyStateCard title="No listings yet" description="Create your first listing and attach it to a project if applicable." />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Revision queue</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {workspace.listingRevisions.length ? workspace.listingRevisions.map((revision) => (
            <div key={revision.id} className="rounded-2xl border border-white/10 p-4">
              <p className="font-medium">{revision.title || revision.listing_id || "Listing revision"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{[compactLabel(revision.change_type), compactLabel(revision.review_status), revision.submitted_at ? new Date(revision.submitted_at).toLocaleString() : null].filter(Boolean).join(" · ")}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No listing revisions have been submitted yet.</p>}
        </CardContent>
      </Card>

      <PartnerListingEditorDialog
        open={editorOpen}
        onOpenChange={(value) => { setEditorOpen(value); if (!value) setActiveListing(null); }}
        listing={activeListing}
        loading={saveListing.isPending}
        onSubmit={(payload) => saveListing.mutate(payload)}
        projects={workspace.projects}
      />
      <PartnerListingResponseDialog
        open={responseOpen}
        onOpenChange={(value) => { setResponseOpen(value); if (!value) setActiveListing(null); }}
        listing={activeListing}
        mode={responseMode}
        loading={reviewResponse.isPending}
        onSubmit={(payload) => reviewResponse.mutate({ listing: activeListing, ...payload })}
      />
    </div>
  );
}
