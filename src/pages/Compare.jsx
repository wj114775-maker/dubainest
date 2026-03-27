import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Card, CardContent } from "@/components/ui/card";
import CompareActionsCard from "@/components/buyer/CompareActionsCard";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import { getSessionId } from "@/components/leads/leadEngine";

export default function Compare() {
  const [openIntent, setOpenIntent] = useState(false);
  const { data: listings = [] } = useQuery({
    queryKey: ["compare-page"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const [sets, allListings] = await Promise.all([
        base44.entities.CompareSet.list("-updated_date", 50),
        base44.entities.Listing.list("-updated_date", 200),
      ]);
      const compareSet = sets.find((item) => item.session_id === sessionId);
      return allListings.filter((listing) => compareSet?.listing_ids?.includes(listing.id));
    },
    initialData: [],
  });

  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Compare" title="Compare trust, yield, price and fit before you register" description="Compare sets are part of the anonymous browse layer, with registration triggered only when the user takes a protected action." />
      {listings.length ? (
        <>
        <CompareActionsCard onConsult={() => setOpenIntent(true)} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="rounded-[2rem] border-white/10 bg-card/80">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold">{listing.title}</h3>
                <p className="text-sm text-muted-foreground">{listing.property_type} · {listing.listing_type}</p>
                <p className="text-sm">Trust score: {listing.trust_score || 0}</p>
                <p className="text-sm">Price: AED {Number(listing.price || 0).toLocaleString()}</p>
                <p className="text-sm">Bedrooms: {listing.bedrooms || 0}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <BuyerIntentSheet open={openIntent} onOpenChange={setOpenIntent} intentType="request_compare_consultation" title="Request compare consultation" />
        </>
      ) : <EmptyStateCard title="Compare set is empty" description="Add listings to compare price, trust and fit here." />}
    </div>
  );
}