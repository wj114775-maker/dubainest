import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import ListingCard from "@/components/buyer/ListingCard";
import { getSessionId } from "@/components/leads/leadEngine";

export default function Shortlist() {
  const { data: listings = [] } = useQuery({
    queryKey: ["shortlist-page"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const [shortlists, allListings] = await Promise.all([
        base44.entities.Shortlist.list("-updated_date", 50),
        base44.entities.Listing.list("-updated_date", 200),
      ]);
      const shortlist = shortlists.find((item) => item.session_id === sessionId);
      return allListings.filter((listing) => shortlist?.listing_ids?.includes(listing.id));
    },
    initialData: [],
  });

  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Saved" title="Shortlists stay anonymous until you share or request access" description="This is designed for mobile-first saving, later sharing, and controlled sign-up only when trust has been earned." />
      {listings.length ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <EmptyStateCard title="Your shortlist is empty" description="Save any listing and it will appear here with attribution-ready tracking." />}
    </div>
  );
}