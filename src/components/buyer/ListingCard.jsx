import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, BedDouble, Building2, Heart, MapPin, Ruler, Scale } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { saveListingToShortlist, saveListingToCompare } from "@/components/leads/buyerLeadActions";
import { buildListingPath, isShowcaseListing } from "@/lib/buyerListings";

export default function ListingCard({ listing }) {
  const { toast } = useToast();
  const showcase = isShowcaseListing(listing);
  const listingPath = buildListingPath(listing);

  return (
    <Card className="group overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div className="relative aspect-[16/11] bg-muted">
        <img src={listing.hero_image_url} alt={listing.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.68))]" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {listing.is_off_plan ? <Badge className="rounded-full bg-slate-950 px-3 py-1.5 text-white hover:bg-slate-950">Off-Plan</Badge> : <Badge className="rounded-full bg-emerald-700 px-3 py-1.5 text-white hover:bg-emerald-700">Ready</Badge>}
          {listing.is_private_inventory ? <Badge className="rounded-full bg-amber-900/90 px-3 py-1.5 text-white hover:bg-amber-900/90">Private inventory</Badge> : null}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">{listing.property_type || "Property"}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">AED {listing.price?.toLocaleString()}</p>
            </div>
            <Badge className="rounded-full border border-white/25 bg-white/12 px-3 py-1.5 text-white hover:bg-white/12">
              Sale only
            </Badge>
          </div>
        </div>
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">{listing.title}</h3>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {listing.area_name || "Dubai"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {listing.developer_name || "Dubai property"}
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-7 text-slate-600">
            {listing.description || `${listing.property_type || "Property"} for sale in ${listing.area_name || "Dubai"} with a cleaner buyer-facing route into project and developer context.`}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Bedrooms</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              <BedDouble className="h-4 w-4" />
              {listing.bedrooms || 0}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Property type</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Building2 className="h-4 w-4" />
              {listing.property_type || "Property"}
            </p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Built-up area</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
              <Ruler className="h-4 w-4" />
              {Number(listing.built_up_area_sqft || 0).toLocaleString()} sqft
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-slate-200"
              disabled={showcase}
              onClick={async () => {
                if (showcase) return;
                await saveListingToShortlist(listing);
                toast({ title: "Saved to shortlist" });
              }}
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-slate-200"
              disabled={showcase}
              onClick={async () => {
                if (showcase) return;
                await saveListingToCompare(listing);
                toast({ title: "Added to compare" });
              }}
            >
              <Scale className="h-4 w-4" />
            </Button>
          </div>

          <Button
            asChild
            className="rounded-full px-5"
          >
            <Link to={listingPath}>
              View details
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
