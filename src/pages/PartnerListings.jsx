import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import PartnerListingsTable from "@/components/partner/PartnerListingsTable";
import PartnerListingsHealthCard from "@/components/partner/PartnerListingsHealthCard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";

export default function PartnerListings() {
  const { data: current } = useCurrentUserRole();
  const queryClient = useQueryClient();

  const { data: listings = [] } = useQuery({
    queryKey: ["partner-listings", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, listingsData] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        base44.entities.Listing.list("-updated_date", 200),
      ]);

      const partnerAgencyId = profiles[0]?.partner_agency_id;
      return listingsData.filter((listing) => listing.partner_agency_id === partnerAgencyId);
    },
    initialData: [],
  });

  const evaluateListing = useMutation({
    mutationFn: (listingId) => base44.functions.invoke("evaluateListingGovernance", { listing_id: listingId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-listings", current.user?.id] })
  });

  const listingAction = useMutation({
    mutationFn: async ({ listing, action }) => {
      if (action === "refresh") {
        return base44.entities.Listing.update(listing.id, { last_refreshed_at: new Date().toISOString(), status: "submitted" });
      }
      if (action === "submit") {
        return base44.entities.Listing.update(listing.id, { status: "submitted" });
      }
      if (action === "republish") {
        await base44.entities.ListingPublicationDecision.create({
          listing_id: listing.id,
          decision_type: "republish",
          decision_status: "pending",
          reason: "Partner requested republish",
          snapshot: { status: listing.status, publication_status: listing.publication_status }
        });
        return base44.entities.Listing.update(listing.id, { status: "under_review", publication_status: "suppressed" });
      }
      if (action === "evidence") {
        await base44.entities.ComplianceEvidence.create({
          listing_id: listing.id,
          compliance_case_id: "manual_partner_submission",
          file_url: listing.hero_image_url || "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80",
          evidence_type: "note",
          notes: "Partner submitted additional evidence for review.",
          status: "submitted"
        });
        return base44.entities.Listing.update(listing.id, { status: "under_review" });
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-listings", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
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
      <SectionHeading eyebrow="Listings" title="Permit, duplicate and stale controls before publishing" description="Partners can only operate published inventory once compliance and verification gates have been satisfied." />
      <AdminSummaryStrip items={summary} />
      <PartnerListingsHealthCard listings={listings} />
      <PartnerListingsTable listings={listings} onEvaluate={evaluateListing.mutate} evaluatingId={evaluateListing.isPending ? evaluateListing.variables : null} onAction={(listing, action) => listingAction.mutate({ listing, action })} actionLoading={listingAction.isPending ? listingAction.variables?.listing?.id : null} />
    </div>
  );
}