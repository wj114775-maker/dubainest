import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import PartnerListingsTable from "@/components/partner/PartnerListingsTable";

const listings = [
  { id: "1", title: "Marina Waterfront Residence", status: "published", permit_verified: true, trust_score: 90 },
  { id: "2", title: "Downtown Sky Suite", status: "pending_verification", permit_verified: false, trust_score: 64 }
];

export default function PartnerListings() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Listings" title="Permit, duplicate and stale controls before publishing" description="Partners can only operate published inventory once compliance and verification gates have been satisfied." />
      <PartnerListingsTable listings={listings} />
    </div>
  );
}