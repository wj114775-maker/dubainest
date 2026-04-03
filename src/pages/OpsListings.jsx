import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import AccessGuard from "@/components/admin/AccessGuard";
import QueueCard from "@/components/common/QueueCard";
import ListingGovernanceQueue from "@/components/ops/ListingGovernanceQueue";
import { Button } from "@/components/ui/button";
import { compactLabel } from "@/lib/buyerPipeline";

export default function OpsListings() {
  const [showFullQueue, setShowFullQueue] = useState(false);
  const { data: listings = [] } = useQuery({
    queryKey: ["ops-listings"],
    queryFn: () => base44.entities.Listing.list("-updated_date", 200),
    initialData: []
  });

  const summary = [
    { label: "Governed listings", value: String(listings.length) },
    { label: "Under review", value: String(listings.filter((item) => ["under_review", "verification_pending", "flagged"].includes(item.status)).length) },
    { label: "Frozen", value: String(listings.filter((item) => item.status === "frozen").length) },
    { label: "Stale", value: String(listings.filter((item) => item.freshness_status === "stale" || item.freshness_status === "expired").length) },
    { label: "Published", value: String(listings.filter((item) => item.publication_status === "published").length) }
  ];

  const reviewQueue = useMemo(() => listings
    .filter((item) => ["under_review", "verification_pending", "flagged"].includes(item.status))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title || item.id,
      meta: [item.partner_agency_id, item.publication_status].filter(Boolean).join(" · "),
      status: item.status,
      badges: [item.trust_band, item.freshness_status].filter(Boolean),
      href: `/ops/listings/${item.id}`
    })), [listings]);

  const correctionQueue = useMemo(() => listings
    .filter((item) => ["frozen", "suppressed", "rejected"].includes(item.publication_status) || item.status === "frozen")
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title || item.id,
      meta: [item.partner_agency_id, item.status].filter(Boolean).join(" · "),
      status: item.publication_status || item.status,
      badges: [item.trust_band, item.freshness_status].filter(Boolean),
      href: `/ops/listings/${item.id}`
    })), [listings]);

  const freshnessQueue = useMemo(() => listings
    .filter((item) => ["stale", "expired"].includes(item.freshness_status))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title || item.id,
      meta: [item.partner_agency_id, item.publication_status].filter(Boolean).join(" · "),
      status: item.freshness_status,
      badges: [item.trust_band, item.status].filter(Boolean),
      href: `/ops/listings/${item.id}`
    })), [listings]);

  const queue = listings.filter((item) => ["under_review", "verification_pending", "flagged", "frozen", "stale"].includes(item.status));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Supply review"
        title="Listing trust, verification, and publication"
        description="This page now stays focused on the three supply questions that matter day to day: what needs review, what needs correction, and what has gone stale."
        action={<Button variant="outline" onClick={() => setShowFullQueue((current) => !current)}>{showFullQueue ? "Hide full queue" : "Show full queue"}</Button>}
      />
      <AccessGuard permission="compliance_cases.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        <div className="grid gap-6 xl:grid-cols-3">
          <QueueCard title="Needs review" items={reviewQueue} emptyMessage="No listings are waiting for first review." formatStatus={compactLabel} />
          <QueueCard title="Needs correction" items={correctionQueue} emptyMessage="No listings are frozen or blocked right now." formatStatus={compactLabel} />
          <QueueCard title="Stale supply" items={freshnessQueue} emptyMessage="No listings have freshness issues right now." formatStatus={compactLabel} />
        </div>
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        {showFullQueue ? <ListingGovernanceQueue listings={queue} /> : null}
      </AccessGuard>
    </div>
  );
}
