import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TrustBadge from "@/components/common/TrustBadge";
import BuyerIntentSheet from '@/components/leads/BuyerIntentSheet';

export default function ListingDetail() {
  const { id } = useParams();
  const [intentType, setIntentType] = useState('request_callback');
  const [open, setOpen] = useState(false);
  const { data: listing, isLoading } = useQuery({ queryKey: ["listing", id], queryFn: async () => base44.entities.Listing.get(id), enabled: !!id, initialData: null });

  if (isLoading) {
    return <div className="pb-28 text-sm text-muted-foreground">Loading listing...</div>;
  }

  if (!listing) {
    return <div className="pb-28 text-sm text-muted-foreground">Listing not found.</div>;
  }

  return (
    <>
    <div className="space-y-6 pb-28">
      <div className="overflow-hidden rounded-[2rem] border border-white/10">
        <img src={listing.hero_image_url || "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80"} alt={listing.title} className="h-[320px] w-full object-cover md:h-[480px]" />
      </div>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <TrustBadge score={listing.trust_score || 0} />
            {listing.trust_band === 'verified' || listing.verification_status === 'verified' ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Verified</Badge> : null}
            <Badge variant="outline">Last checked {listing.last_checked_at ? new Date(listing.last_checked_at).toLocaleDateString() : 'Pending'}</Badge>
            <Badge variant="outline">Partner {listing.partner_verified ? 'verified' : 'pending'}</Badge>
            <Badge variant="outline">Project {listing.project_status_verified ? 'checked' : 'pending'}</Badge>
            {listing.is_private_inventory ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Private inventory</Badge> : null}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">{listing.title}</h1>
          <p className="max-w-3xl text-muted-foreground">{listing.description || "No description available yet."}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-card/80 p-5">
          <p className="text-sm text-muted-foreground">Guide price</p>
          <p className="mt-2 text-3xl font-semibold">AED {Number(listing.price || 0).toLocaleString()}</p>
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