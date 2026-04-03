import React from "react";
import { Link } from "react-router-dom";
import { Bath, BedDouble, CarFront, ChevronRight, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TrustBadge from "@/components/common/TrustBadge";
import { isShowcaseListing } from "@/lib/buyerListings";

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-background/70 px-3 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-[11px] uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export default function ListingListRow({ listing }) {
  const showcase = isShowcaseListing(listing);
  const statusLabel = listing.is_off_plan ? "Off-Plan" : "Ready";
  const statusClassName = listing.is_off_plan
    ? "bg-sky-950 text-white hover:bg-sky-950"
    : "bg-emerald-700 text-white hover:bg-emerald-700";
  const summary = listing.description && listing.description.length > 160
    ? `${listing.description.slice(0, 157)}...`
    : listing.description;

  return (
    <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
      <CardContent className="p-0">
        <div className="grid gap-0 lg:grid-cols-[320px,1fr]">
          <div className="relative min-h-[260px] bg-muted">
            <img
              src={listing.hero_image_url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              <Badge className={`rounded-full ${statusClassName}`}>{statusLabel}</Badge>
              {listing.is_private_inventory ? (
                <Badge className="rounded-full bg-black/70 text-white hover:bg-black/70">Private Inventory</Badge>
              ) : null}
              {showcase ? (
                <Badge variant="outline" className="rounded-full border-white/30 bg-white/90 text-slate-900">
                  Showcase
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex min-h-full flex-col justify-between p-5 md:p-6">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <TrustBadge score={listing.trust_score || 0} />
                    {listing.floor_plan_available ? (
                      <Badge variant="outline" className="rounded-full">Floor plan</Badge>
                    ) : null}
                    {listing.is_off_plan && listing.handover_label ? (
                      <Badge variant="outline" className="rounded-full">Handover {listing.handover_label}</Badge>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {listing.area_name || "Dubai"}
                      {listing.developer_name ? <span className="text-muted-foreground/70">· {listing.developer_name}</span> : null}
                    </p>
                    <h3 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                      {listing.title}
                    </h3>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {summary || "Verified property summary coming soon."}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 px-4 py-4 xl:min-w-[220px]">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Guide price</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                    AED {Number(listing.price || 0).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {listing.is_off_plan
                      ? `Purchase pathway with ${listing.handover_label || "future"} handover`
                      : showcase
                        ? "Showcase stock while live inventory grows"
                        : "Purchase-ready inventory"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Beds" value={listing.bedrooms || 0} icon={BedDouble} />
                <Metric label="Baths" value={listing.bathrooms || 0} icon={Bath} />
                <Metric label="Parking" value={listing.parking_spaces || 0} icon={CarFront} />
                <Metric label="Size" value={`${Number(listing.built_up_area_sqft || 0).toLocaleString()} sqft`} icon={Ruler} />
              </div>

              {listing.is_off_plan ? (
                <div className="rounded-[1.2rem] border border-sky-950/10 bg-sky-950/5 px-4 py-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Off-Plan purchase signal</p>
                  <p className="mt-1">
                    Future-delivery inventory with a dedicated badge, filtered completion status, and handover timing surfaced up front.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                {showcase
                  ? "Designed to keep the catalogue visually alive until more live partner stock is published."
                  : "Clean purchase-first presentation with fewer competing data points."}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="outline" className="rounded-full px-5">
                  <Link to={`/listing/${listing.id}`}>Open details</Link>
                </Button>
                <Button asChild className="rounded-full px-5">
                  <Link to={`/listing/${listing.id}`}>
                    {listing.is_off_plan ? "View off-plan details" : showcase ? "Request similar" : "View and enquire"}
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
