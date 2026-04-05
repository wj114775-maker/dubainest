import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import ListingGovernanceQueue from "@/components/ops/ListingGovernanceQueue";
import ListingRegistryTableCard from "@/components/admin/ListingRegistryTableCard";
import AdminListingEditorDialog from "@/components/admin/AdminListingEditorDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function OpsListings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const { data: listings = [] } = useQuery({
    queryKey: ["ops-listings-table"],
    queryFn: () => base44.entities.Listing.list("-updated_date", 300),
    initialData: [],
  });

  const summary = [
    { label: "Listings", value: String(listings.length) },
    { label: "Draft", value: String(listings.filter((item) => item.status === "draft").length) },
    { label: "Under review", value: String(listings.filter((item) => ["under_review", "verification_pending", "flagged"].includes(item.status)).length) },
    { label: "Published", value: String(listings.filter((item) => item.publication_status === "published").length) },
  ];

  const advancedQueue = useMemo(
    () => listings.filter((item) => ["under_review", "verification_pending", "flagged", "frozen", "stale"].includes(item.status)),
    [listings]
  );

  const saveListing = useMutation({
    mutationFn: async (payload) => {
      if (editingListing?.id) {
        return await base44.entities.Listing.update(editingListing.id, payload);
      }
      return await base44.entities.Listing.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-listings-table"] });
      setEditingListing(null);
      setEditorOpen(false);
      toast({ title: "Listing saved" });
    },
    onError: (error) => {
      toast({
        title: "Listing save failed",
        description: String(error?.message || "The listing could not be saved."),
        variant: "destructive",
      });
    },
  });

  const openCreate = () => {
    setEditingListing(null);
    setEditorOpen(true);
  };

  const openEdit = (listing) => {
    setEditingListing(listing);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title="Listings"
        description="This is the listings table. Add and edit stock here first. Advanced review stays available, but it is no longer the main view."
        action={(
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link to="/properties">Open public property page</Link>
            </Button>
            <Button onClick={openCreate}>Add listing</Button>
          </div>
        )}
      />
      <AccessGuard permission="compliance_cases.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        {listings.length ? (
          <ListingRegistryTableCard listings={listings} onEdit={openEdit} />
        ) : (
          <EmptyStateCard title="No listings yet" description="Add your first listing when you are ready." />
        )}
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setShowAdvanced((current) => !current)}>
            {showAdvanced ? "Hide advanced review" : "Show advanced review"}
          </Button>
        </div>
        {showAdvanced ? <ListingGovernanceQueue listings={advancedQueue} /> : null}
      </AccessGuard>

      <AccessGuard permission="compliance_cases.manage">
        <AdminListingEditorDialog
          open={editorOpen}
          onOpenChange={(open) => {
            setEditorOpen(open);
            if (!open) setEditingListing(null);
          }}
          listing={editingListing}
          loading={saveListing.isPending}
          onSubmit={(payload) => saveListing.mutate(payload)}
        />
      </AccessGuard>
    </div>
  );
}
