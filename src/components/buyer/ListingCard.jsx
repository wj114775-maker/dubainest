import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BedDouble, Building2, Heart, MapPin, Scale } from "lucide-react";
import TrustBadge from "@/components/common/TrustBadge";

export default function ListingCard({ listing }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-card/80 shadow-xl shadow-black/5">
      <div className="aspect-[4/3] bg-muted">
        <img src={listing.hero_image_url} alt={listing.title} className="h-full w-full object-cover" />
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">{listing.property_type}</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight">{listing.title}</h3>
          </div>
          <TrustBadge score={listing.trust_score} />
        </div>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {listing.area_name}</span>
          <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> {listing.bedrooms} bed</span>
          <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> Permit verified</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">From</p>
            <p className="text-2xl font-semibold">AED {listing.price?.toLocaleString()}</p>
          </div>
          <Badge variant="outline" className="rounded-full">{listing.listing_type === "private_inventory" ? "Private" : "Published"}</Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" className="rounded-2xl"><Heart className="mr-2 h-4 w-4" /> Save</Button>
          <Button variant="outline" className="rounded-2xl"><Scale className="mr-2 h-4 w-4" /> Compare</Button>
          <Button asChild className="rounded-2xl"><Link to={`/listing/${listing.id}`}>View</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}