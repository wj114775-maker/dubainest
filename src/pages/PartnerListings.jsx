import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import PartnerListingsTable from "@/components/partner/PartnerListingsTable";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";

export default function PartnerListings() {
  const { data: current } = useCurrentUserRole();

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

  const summary = [
    { label: "Listings", value: String(listings.length) },
    { label: "Published", value: String(listings.filter((item) => item.status === "published").length) },
    { label: "Needs verification", value: String(listings.filter((item) => !item.permit_verified).length) },
    { label: "Private", value: String(listings.filter((item) => item.is_private_inventory).length) }
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Listings" title="Permit, duplicate and stale controls before publishing" description="Partners can only operate published inventory once compliance and verification gates have been satisfied." />
      <AdminSummaryStrip items={summary} />
      <PartnerListingsTable listings={listings} />
    </div>
  );
}