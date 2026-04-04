import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BuyerIntentSheet from '@/components/leads/BuyerIntentSheet';
import { isShowcaseListing, loadBuyerListingById } from "@/lib/buyerListings";

export default function ListingDetail() {
  const { id } = useParams();
  const [intentType, setIntentType] = useState('request_callback');
  const [open, setOpen] = useState(false);
  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => loadBuyerListingById(id),
    enabled: !!id,
    initialData: null
  });

  if (isLoading) {
    return <div className="pb-28 text-sm text-muted-foreground">Loading listing...</div>;
  }

  if (!listing) {
    return <div className="pb-28 text-sm text-muted-foreground">Listing not found.</div>;
  }

  const showcase = isShowcaseListing(listing);

  return (
    <>
    <div className="space-y-6 pb-28">
      <div className="overflow-hidden rounded-[2rem] border border-white/10">
        <img src={listing.hero_image_url || "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80"} alt={listing.title} className="h-[320px] w-full object-cover md:h-[480px]" />
      </div>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {listing.is_off_plan ? <Badge className="bg-sky-950 text-white hover:bg-sky-950">Off-Plan</Badge> : <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">Ready</Badge>}
            <Badge variant="outline">{listing.property_type || "Property"}</Badge>
            {listing.is_off_plan && listing.handover_label ? <Badge variant="outline">Handover {listing.handover_label}</Badge> : null}
            {listing.is_private_inventory ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Private inventory</Badge> : null}
            {listing.developer_name ? <Badge variant="outline">{listing.developer_name}</Badge> : null}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">{listing.title}</h1>
          <p className="text-sm text-muted-foreground">
            {[listing.area_name || "Dubai", listing.developer_name].filter(Boolean).join(" · ")}
          </p>
          <p className="max-w-3xl text-muted-foreground">{listing.description || "No description available yet."}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-card/80 p-5">
          <p className="text-sm text-muted-foreground">Price</p>
          <p className="mt-2 text-3xl font-semibold">AED {Number(listing.price || 0).toLocaleString()}</p>
          {listing.is_off_plan ? <p className="mt-2 text-sm text-muted-foreground">Completion status: Off-Plan{listing.handover_label ? ` · Handover ${listing.handover_label}` : ""}</p> : null}
          <div className="mt-4 grid gap-2">
            <Button className="rounded-2xl" onClick={() => { setIntentType('request_callback'); setOpen(true); }}>
              {showcase ? "Enquire now" : "Enquire now"}
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => { setIntentType('request_private_inventory'); setOpen(true); }}>
              {listing.is_private_inventory ? "Request private inventory" : "Request buying advice"}
            </Button>
          </div>
        </div>
      </div>
    </div>
    <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType={intentType} listingId={showcase ? "" : listing.id} title={listing.title} />
    </>
  );
}
