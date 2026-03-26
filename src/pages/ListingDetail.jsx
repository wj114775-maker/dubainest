import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TrustBadge from "@/components/common/TrustBadge";
import BuyerIntentSheet from '@/components/leads/BuyerIntentSheet';

const fallbackListing = {
  id: "fallback",
  title: "Verified Dubai Residence",
  description: "A premium listing detail surface showing why this opportunity can be trusted before the buyer shares personal information.",
  price: 4200000,
  hero_image_url: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80",
  permit_verified: true,
  title_deed_verified: true,
  project_status_verified: true,
  trust_score: 92,
  publish_block_reason: "",
  is_private_inventory: false
};

export default function ListingDetail() {
  const { id } = useParams();
  const [intentType, setIntentType] = useState('request_callback');
  const [open, setOpen] = useState(false);
  const { data: listing = fallbackListing } = useQuery({ queryKey: ["listing", id], queryFn: async () => base44.entities.Listing.get(id), initialData: fallbackListing });

  return (
    <>
    <div className="space-y-6 pb-28">
      <div className="overflow-hidden rounded-[2rem] border border-white/10">
        <img src={listing.hero_image_url} alt={listing.title} className="h-[320px] w-full object-cover md:h-[480px]" />
      </div>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <TrustBadge score={listing.trust_score} />
            <Badge variant="outline">Permit {listing.permit_verified ? "verified" : "pending"}</Badge>
            <Badge variant="outline">Title deed {listing.title_deed_verified ? "checked" : "pending"}</Badge>
            <Badge variant="outline">Project {listing.project_status_verified ? "checked" : "pending"}</Badge>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">{listing.title}</h1>
          <p className="max-w-3xl text-muted-foreground">{listing.description}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-card/80 p-5">
          <p className="text-sm text-muted-foreground">Guide price</p>
          <p className="mt-2 text-3xl font-semibold">AED {listing.price?.toLocaleString()}</p>
          <div className="mt-4 grid gap-2">
            <Button className="rounded-2xl" onClick={() => { setIntentType('request_callback'); setOpen(true); }}>Request broker callback</Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => { setIntentType('request_private_inventory'); setOpen(true); }}>Request private inventory access</Button>
          </div>
        </div>
      </div>
    </div>
    <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType={intentType} listingId={listing.id} title={listing.title} />
    </>
  );
}