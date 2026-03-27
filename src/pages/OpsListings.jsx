import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import AccessGuard from "@/components/admin/AccessGuard";
import ListingGovernanceQueue from "@/components/ops/ListingGovernanceQueue";

export default function OpsListings() {
  const { data: listings = [] } = useQuery({
    queryKey: ["ops-listings"],
    queryFn: () => base44.entities.Listing.list("-updated_date", 200),
    initialData: []
  });

  const summary = [
    { label: "Governed listings", value: String(listings.length) },
    { label: "Under review", value: String(listings.filter((item) => ["under_review", "verification_pending", "flagged"].includes(item.status)).length) },
    { label: "Frozen", value: String(listings.filter((item) => item.status === "frozen").length) },
    { label: "Stale", value: String(listings.filter((item) => item.freshness_status === "stale" || item.freshness_status === "expired").length) }
  ];

  const queue = listings.filter((item) => ["under_review", "verification_pending", "flagged", "frozen", "stale"].includes(item.status));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Supply governance" title="Listing trust, verification and publication control" description="Internal teams review supply quality, authority, freshness and publishing readiness here." />
      <AccessGuard permission="compliance_cases.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        <ListingGovernanceQueue listings={queue} />
      </AccessGuard>
    </div>
  );
}