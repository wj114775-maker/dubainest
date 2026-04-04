import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bath,
  BedDouble,
  CarFront,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircleMore,
  Ruler,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function CompactMetric({ value, icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-background/80 px-3 py-1.5 text-sm text-foreground">
      <Icon className="h-4 w-4 stroke-[2.45]" />
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
  const navigate = useNavigate();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [listing.id]);

  const galleryImages = useMemo(() => {
    const images = Array.isArray(listing.gallery_image_urls) ? listing.gallery_image_urls.filter(Boolean) : [];
    return images.length ? images : [listing.hero_image_url].filter(Boolean);
  }, [listing.gallery_image_urls, listing.hero_image_url]);

  const summary = String(listing.description || "").replace(/\s+/g, " ").trim();
  const shortSummary = summary.length > 92 ? `${summary.slice(0, 89)}...` : summary;
  const statusLabel = listing.is_off_plan ? "Off-Plan" : "Ready";
  const statusClassName = listing.is_off_plan
    ? "bg-sky-950 text-white hover:bg-sky-950"
    : "bg-emerald-700 text-white hover:bg-emerald-700";
  const propertyType = listing.property_type || "Property";
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, listing);

  const openListing = () => navigate(`/listing/${listing.id}`);

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openListing();
    }
  };

  const stopEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  const showPrevImage = (event) => {
    stopEvent(event);
    setActiveImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
  };

  const showNextImage = (event) => {
    stopEvent(event);
    setActiveImageIndex((current) => (current + 1) % galleryImages.length);
  };

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-white/10 bg-card/95 shadow-lg shadow-black/5 transition hover:border-primary/20 hover:shadow-xl hover:shadow-black/10 md:max-w-[780px]">
      <CardContent className="p-0">
        <article
          data-listing-row={listing.id}
          role="link"
          tabIndex={0}
          onClick={openListing}
          onKeyDown={handleKeyDown}
          className="group grid cursor-pointer gap-0 md:h-[230px] md:grid-cols-[325px,1fr]"
        >
          <div className="relative aspect-[360/255] overflow-hidden bg-muted md:h-[230px] md:w-[325px]">
            <img
              src={galleryImages[activeImageIndex]}
              alt={listing.title}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />

            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <Badge className={`rounded-full ${statusClassName}`}>{statusLabel}</Badge>
              <Badge variant="outline" className="rounded-full border-white/25 bg-white/92 text-slate-900">
                {propertyType}
              </Badge>
              {listing.is_private_inventory ? (
                <Badge className="rounded-full bg-black/75 text-white hover:bg-black/75">Private Inventory</Badge>
              ) : null}
            </div>

            {galleryImages.length > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                  onClick={showPrevImage}
                >
                  <ChevronLeft className="h-5 w-5 stroke-[2.45]" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                  onClick={showNextImage}
                >
                  <ChevronRight className="h-5 w-5 stroke-[2.45]" />
                </button>
                <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              </>
            ) : null}
          </div>

          <div className="flex h-full flex-col justify-between overflow-hidden p-4 md:p-4">
            <div className="space-y-2.5">
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                AED {Number(listing.price || 0).toLocaleString()}
              </p>

              <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-sm text-muted-foreground">
                <span className="shrink-0 font-medium text-foreground">{propertyType}</span>
                <span className="shrink-0 text-muted-foreground/50">•</span>
                <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{listing.area_name || "Dubai"}</span>
                </span>
                {listing.developer_name ? (
                  <>
                    <span className="shrink-0 text-muted-foreground/50">•</span>
                    <span className="truncate">{listing.developer_name}</span>
                  </>
                ) : null}
                {listing.is_off_plan && listing.handover_label ? (
                  <>
                    <span className="shrink-0 text-muted-foreground/50">•</span>
                    <span className="shrink-0">Handover {listing.handover_label}</span>
                  </>
                ) : null}
              </div>

              <h3 className="truncate text-lg font-semibold tracking-tight text-foreground md:text-[1.3rem]">
                {listing.title}
              </h3>

              <p className="max-w-3xl truncate text-sm leading-5 text-muted-foreground">
                {shortSummary || "Dubai purchase opportunity with clean pricing and key property details."}
              </p>

              <div className="flex flex-wrap gap-2">
                <CompactMetric label="Bedrooms" value={listing.bedrooms || 0} icon={BedDouble} />
                <CompactMetric label="Bathrooms" value={listing.bathrooms || 0} icon={Bath} />
                {Number(listing.parking_spaces || 0) > 0 ? (
                  <CompactMetric label="Parking" value={listing.parking_spaces || 0} icon={CarFront} />
                ) : null}
                <CompactMetric label="Built-up area" value={`${Number(listing.built_up_area_sqft || 0).toLocaleString()} sqft`} icon={Ruler} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-white/10 pt-3">
              <Button
                asChild
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-emerald-600/25 bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/15 hover:text-emerald-800"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`WhatsApp about ${listing.title}`}
                  onClick={stopPropagation}
                >
                  <MessageCircleMore className="h-5 w-5 stroke-[2.45]" />
                </a>
              </Button>
              <Button
                type="button"
                className="h-10 rounded-full px-5"
                onClick={(event) => {
                  stopEvent(event);
                  openListing();
                }}
              >
                View details
              </Button>
            </div>
          </div>
        </article>
      </CardContent>
    </Card>
  );
}
