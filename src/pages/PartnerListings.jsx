import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import PartnerListingsTable from "@/components/partner/PartnerListingsTable";
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

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Listings" title="Permit, duplicate and stale controls before publishing" description="Partners can only operate published inventory once compliance and verification gates have been satisfied." />
      <PartnerListingsTable listings={listings} />
    </div>
  );
}