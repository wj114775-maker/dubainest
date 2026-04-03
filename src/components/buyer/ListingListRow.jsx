import React from "react";
import { Link } from "react-router-dom";
import { Bath, BedDouble, Building2, ChevronRight, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TrustBadge from "@/components/common/TrustBadge";
import { isShowcaseListing } from "@/lib/buyerListings";

export default function ListingListRow({ listing }) {
  const showcase = isShowcaseListing(listing);

  return (
    <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-card/90 shadow-xl shadow-black/5">
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[320px,1fr]">
          <div className="relative min-h-[250px] bg-muted">
            <img
              src={listing.hero_image_url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Badge className="rounded-full bg-black/55 text-white hover:bg-black/55">
                {listing.property_type}
              </Badge>
              {listing.is_private_inventory ? (
                <Badge className="rounded-full bg-primary/90 text-primary-foreground hover:bg-primary/90">
                  Private inventory
                </Badge>
              ) : null}
              {showcase ? (
                <Badge variant="outline" className="rounded-full border-white/20 bg-white/90 text-slate-900">
                  Showcase
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-full flex-col justify-between p-6">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <TrustBadge score={listing.trust_score || 0} />
                    <Badge variant="outline" className="rounded-full">
                      {listing.permit_verified ? "Permit verified" : "Permit review pending"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      Freshness {listing.freshness_status || "fresh"}
                    </Badge>
                    {listing.partner_verified ? (
                      <Badge variant="outline" className="rounded-full">
                        Partner verified
                      </Badge>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                      {listing.title}
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                      {listing.description || "Verified listing summary coming soon."}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-primary/15 bg-primary/5 px-5 py-4 text-left xl:min-w-[210px]">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                    Guide price
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    AED {Number(listing.price || 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {showcase ? "Showcase stock while live feed grows" : "Live inventory"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {listing.area_name || "Dubai"}
                </span>
                <span className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4" />
                  {listing.bedrooms || 0} bedrooms
                </span>
                <span className="flex items-center gap-2">
                  <Bath className="h-4 w-4" />
                  {listing.bathrooms || 0} bathrooms
                </span>
                <span className="flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  {Number(listing.built_up_area_sqft || 0).toLocaleString()} sqft
                </span>
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {listing.listing_type === "private_inventory" ? "Private client access" : "Ready to review"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {showcase
                  ? "Showcase examples keep the catalogue alive until live partner stock is published."
                  : "Reviewed supply surfaced with trust, freshness, and verification signals."}
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline" className="rounded-full px-5">
                  <Link to={`/listing/${listing.id}`}>
                    {showcase ? "Preview property" : "Open details"}
                  </Link>
                </Button>
                <Button asChild className="rounded-full px-5">
                  <Link to={`/listing/${listing.id}`}>
                    {showcase ? "Request similar" : "View and enquire"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
