import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import PartnerListingsTable from "@/components/partner/PartnerListingsTable";
import PartnerListingsHealthCard from "@/components/partner/PartnerListingsHealthCard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { Button } from "@/components/ui/button";
import PartnerListingEditorDialog from "@/components/partner/PartnerListingEditorDialog";
import PartnerListingResponseDialog from "@/components/partner/PartnerListingResponseDialog";

export default function PartnerListings() {
  const { data: current } = useCurrentUserRole();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);
  const [responseMode, setResponseMode] = useState("response");
  const [activeListing, setActiveListing] = useState(null);

  const { data: listingWorkspace = { partnerAgencyId: "", listings: [] } } = useQuery({
    queryKey: ["partner-listings", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, listingsData] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        base44.entities.Listing.list("-updated_date", 200),
      ]);

      const partnerAgencyId = profiles[0]?.partner_agency_id;
      return {
        partnerAgencyId,
        listings: listingsData.filter((listing) => listing.partner_agency_id === partnerAgencyId)
      };
    },
    initialData: { partnerAgencyId: "", listings: [] },
  });
  const listings = listingWorkspace.listings;

  const evaluateListing = useMutation({
    mutationFn: (listingId) => base44.functions.invoke("evaluateListingGovernance", { listing_id: listingId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-listings", current.user?.id] })
  });

  const saveListing = useMutation({
    mutationFn: async (payload) => {
      const response = await base44.functions.invoke("partnerManageListing", {
        action: activeListing?.id ? "update" : "create",
        listing_id: activeListing?.id,
        payload
      });
      return response?.listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-listings", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["ops-listings"] });
      setEditorOpen(false);
      setActiveListing(null);
    }
  });

  const listingAction = useMutation({
    mutationFn: async ({ listing, action }) => {
      const response = await base44.functions.invoke("partnerManageListing", {
        action,
        listing_id: listing.id
      });
      if (["refresh", "submit", "republish"].includes(action)) {
        await base44.functions.invoke("evaluateListingGovernance", { listing_id: listing.id });
      }
      return response?.listing ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-listings", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["ops-listings"] });
    }
  });

  const reviewResponse = useMutation({
    mutationFn: async ({ listing, notes, evidenceUrl, resubmit, mode }) => {
      const response = await base44.functions.invoke("partnerManageListing", {
        action: mode === "response" ? "respond" : "evidence",
        listing_id: listing.id,
        notes,
        evidence_url: evidenceUrl,
        resubmit,
        mode
      });
      await base44.functions.invoke("evaluateListingGovernance", { listing_id: listing.id });
      return response?.listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-listings", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["ops-listings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
      setResponseOpen(false);
      setActiveListing(null);
    }
  });

  const summary = [
    { label: "Listings", value: String(listings.length) },
    { label: "Published", value: String(listings.filter((item) => item.publication_status === "published").length) },
    { label: "Needs review", value: String(listings.filter((item) => ["verification_pending", "under_review", "flagged"].includes(item.status)).length) },
    { label: "Frozen/Stale", value: String(listings.filter((item) => ["frozen", "stale"].includes(item.status)).length) }
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Listings"
        title="Permit, duplicate and stale controls before publishing"
        description="Partners can draft supply, respond to review, refresh stale stock and request republish inside a controlled governance loop."
        action={<Button onClick={() => { setActiveListing(null); setEditorOpen(true); }} disabled={!listingWorkspace.partnerAgencyId}>Create listing</Button>}
      />
      <AdminSummaryStrip items={summary} />
      <PartnerListingsHealthCard listings={listings} />
      <PartnerListingsTable
        listings={listings}
        onEvaluate={evaluateListing.mutate}
        evaluatingId={evaluateListing.isPending ? evaluateListing.variables : null}
        onAction={(listing, action) => listingAction.mutate({ listing, action })}
        onEdit={(listing) => { setActiveListing(listing); setEditorOpen(true); }}
        onRespond={(listing) => { setActiveListing(listing); setResponseMode("response"); setResponseOpen(true); }}
        onEvidence={(listing) => { setActiveListing(listing); setResponseMode("evidence"); setResponseOpen(true); }}
        actionLoading={listingAction.isPending ? listingAction.variables?.listing?.id : (reviewResponse.isPending ? reviewResponse.variables?.listing?.id : null)}
      />
      <PartnerListingEditorDialog
        open={editorOpen}
        onOpenChange={(value) => { setEditorOpen(value); if (!value) setActiveListing(null); }}
        listing={activeListing}
        loading={saveListing.isPending}
        onSubmit={(payload) => saveListing.mutate(payload)}
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
