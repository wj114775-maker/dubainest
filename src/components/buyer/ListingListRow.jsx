import React from "react";
import { Link } from "react-router-dom";
import { Bath, BedDouble, CarFront, ChevronRight, MapPin, MessageCircleMore, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TrustBadge from "@/components/common/TrustBadge";

function CompactMetric({ value, icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/75 px-3 py-2 text-sm text-foreground">
      <Icon className="h-4 w-4 stroke-[2.35]" />
      <span className="font-medium">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function buildWhatsAppUrl(phone, listing) {
  const number = String(phone || "").replace(/[^\d]/g, "");
  if (!number) {
    return `/listing/${listing.id}`;
  }

  const message = `Hi, I'm interested in ${listing.title}${listing.area_name ? ` in ${listing.area_name}` : ""}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function ListingListRow({ listing, whatsappNumber }) {
  const summary = listing.description && listing.description.length > 108
    ? `${listing.description.slice(0, 105)}...`
    : listing.description;
  const statusLabel = listing.is_off_plan ? "Off-Plan" : "Ready";
  const statusClassName = listing.is_off_plan
    ? "bg-sky-950 text-white hover:bg-sky-950"
    : "bg-emerald-700 text-white hover:bg-emerald-700";
  const propertyType = listing.property_type || "Property";
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, listing);

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-white/10 bg-card/95 shadow-lg shadow-black/5">
      <CardContent className="p-0">
        <article data-listing-row={listing.id} className="grid gap-0 md:grid-cols-[250px,1fr] lg:grid-cols-[280px,1fr]">
          <div className="relative aspect-[4/3] bg-muted md:aspect-auto md:min-h-[220px]">
            <img
              src={listing.hero_image_url}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <Badge className={`rounded-full ${statusClassName}`}>{statusLabel}</Badge>
              {listing.is_private_inventory ? (
                <Badge className="rounded-full bg-black/75 text-white hover:bg-black/75">Private Inventory</Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col justify-between p-4 md:p-5">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="rounded-full border-white/15 bg-background/70 px-3">
                      {propertyType}
                    </Badge>
                    <TrustBadge score={listing.trust_score || 0} />
                    {listing.floor_plan_available ? <Badge variant="outline" className="rounded-full">Floor plan</Badge> : null}
                    {listing.is_off_plan && listing.handover_label ? (
                      <Badge variant="outline" className="rounded-full">Handover {listing.handover_label}</Badge>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{listing.area_name || "Dubai"}</span>
                      {listing.developer_name ? <span className="text-muted-foreground/70">· {listing.developer_name}</span> : null}
                    </p>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-[1.35rem]">
                      {listing.title}
                    </h3>
                    <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                      {summary || "A premium Dubai property with verified presentation and clear purchase details."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <CompactMetric label="Bedrooms" value={listing.bedrooms || 0} icon={BedDouble} />
                    <CompactMetric label="Bathrooms" value={listing.bathrooms || 0} icon={Bath} />
                    {Number(listing.parking_spaces || 0) > 0 ? (
                      <CompactMetric label="Parking" value={listing.parking_spaces || 0} icon={CarFront} />
                    ) : null}
                    <CompactMetric label="Built-up area" value={`${Number(listing.built_up_area_sqft || 0).toLocaleString()} sqft`} icon={Ruler} />
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-primary/15 bg-primary/5 px-4 py-3 xl:min-w-[210px]">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">Asking price</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    AED {Number(listing.price || 0).toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {listing.is_off_plan
                      ? `Initial sale${listing.handover_label ? ` · ${listing.handover_label}` : ""}`
                      : "Purchase opportunity"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-4">
              <Button asChild variant="outline" size="icon" className="h-11 w-11 rounded-full border-emerald-600/25 bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/15 hover:text-emerald-800">
                <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label={`WhatsApp about ${listing.title}`}>
                  <MessageCircleMore className="h-5 w-5 stroke-[2.35]" />
                </a>
              </Button>
              <Button asChild className="h-11 rounded-full px-5">
                <Link to={`/listing/${listing.id}`}>
                  View details
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </article>
      </CardContent>
    </Card>
  );
}
