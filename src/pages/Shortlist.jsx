import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import ListingCard from "@/components/buyer/ListingCard";
import ShortlistActionsCard from "@/components/buyer/ShortlistActionsCard";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import ConversionSignalCard from "@/components/buyer/ConversionSignalCard";
import { getSessionId } from "@/components/leads/leadEngine";
import { loadBuyerListingById } from "@/lib/buyerListings";

export default function Shortlist() {
  const [openIntent, setOpenIntent] = useState(false);
  const queryClient = useQueryClient();
  const shareMutation = useMutation({
    mutationFn: async () => {
      const sessionId = getSessionId();
      const shortlists = await base44.entities.Shortlist.list("-updated_date", 50);
      const shortlist = shortlists.find((item) => item.session_id === sessionId);
      if (!shortlist) return null;
      return base44.entities.Shortlist.update(shortlist.id, { share_token: shortlist.share_token || `share_${Date.now()}` });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shortlist-page"] })
  });

  const { data: listings = [] } = useQuery({
    queryKey: ["shortlist-page"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const shortlists = await base44.entities.Shortlist.list("-updated_date", 50);
      const shortlist = shortlists.find((item) => item.session_id === sessionId);
      const items = await Promise.all((shortlist?.listing_ids || []).map((listingId) => loadBuyerListingById(listingId)));
      return items.filter(Boolean);
    },
    initialData: [],
  });

  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Saved" title="Keep your shortlisted properties in one place" description="Save properties, share the shortlist, and request buyer support when you want the team involved." />
      {listings.length ? <>
        <ConversionSignalCard title="Shortlist progress" description="You can share these properties or ask the team to help you move forward with the right options." items={[{ label: "Saved", value: String(listings.length) }, { label: "Share status", value: shareMutation.isSuccess ? "Ready" : "Not shared" }, { label: "Next step", value: "Buyer support" }]} />
        <ShortlistActionsCard onShare={() => shareMutation.mutate()} onConsult={() => setOpenIntent(true)} />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
        <BuyerIntentSheet open={openIntent} onOpenChange={setOpenIntent} intentType="request_shortlist_consultation" title="Request shortlist consultation" />
      </> : <EmptyStateCard title="Your shortlist is empty" description="Save any property and it will appear here for easy comparison later." />}
    </div>
  );
}
