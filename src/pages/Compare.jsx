import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Card, CardContent } from "@/components/ui/card";
import CompareActionsCard from "@/components/buyer/CompareActionsCard";
import ConversionSignalCard from "@/components/buyer/ConversionSignalCard";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import { getSessionId } from "@/components/leads/leadEngine";
import { loadBuyerListingById } from "@/lib/buyerListings";

export default function Compare() {
  const [openIntent, setOpenIntent] = useState(false);
  const { data: listings = [] } = useQuery({
    queryKey: ["compare-page"],
    queryFn: async () => {
      const sessionId = getSessionId();
      const sets = await base44.entities.CompareSet.list("-updated_date", 50);
      const compareSet = sets.find((item) => item.session_id === sessionId);
      const items = await Promise.all((compareSet?.listing_ids || []).map((listingId) => loadBuyerListingById(listingId)));
      return items.filter(Boolean);
    },
    initialData: [],
  });

  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Compare" title="Compare price, size, location and fit before you enquire" description="Compare sets stay in the anonymous browse layer until the buyer chooses to contact the team." />
      {listings.length ? (
        <>
        <ConversionSignalCard title="Compare-to-consultation flow" description="Comparison intent now feeds directly into a guided consultation request with richer intake branching." items={[{ label: "Compared", value: String(listings.length) }, { label: "Comparison", value: "Active" }, { label: "Next step", value: "Consultation" }]} />
        <CompareActionsCard onConsult={() => setOpenIntent(true)} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <Card key={listing.id} className="rounded-[2rem] border-white/10 bg-card/80">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-lg font-semibold">{listing.title}</h3>
                <p className="text-sm text-muted-foreground">{listing.property_type} · {listing.area_name || "Dubai"}</p>
                <p className="text-sm">Price: AED {Number(listing.price || 0).toLocaleString()}</p>
                <p className="text-sm">Bedrooms: {listing.bedrooms || 0}</p>
                <p className="text-sm">Area: {Number(listing.built_up_area_sqft || 0).toLocaleString()} sqft</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <BuyerIntentSheet open={openIntent} onOpenChange={setOpenIntent} intentType="request_compare_consultation" title="Request compare consultation" />
        </>
      ) : <EmptyStateCard title="Compare set is empty" description="Add listings to compare price, size, location, and fit here." />}
    </div>
  );
}
