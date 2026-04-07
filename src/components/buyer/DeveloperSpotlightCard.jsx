import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatPrice(value) {
  if (!value) return "Price on request";
  return `From AED ${Number(value).toLocaleString()}`;
}

export default function DeveloperSpotlightCard({ developer }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div className="relative h-52 bg-muted">
        {developer.heroImageUrl ? (
          <img src={developer.heroImageUrl} alt={developer.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white/10">
              <Building2 className="h-7 w-7" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.72))]" />
        <div className="absolute left-4 top-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Developer profile
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-semibold tracking-tight text-white">{developer.name}</h3>
          <p className="mt-2 text-sm leading-6 text-white/78">
            {developer.listingCount
              ? `${developer.listingCount} homes available, ${developer.offPlanCount} off-plan, ${developer.readyCount} ready to move`
              : "Developer profile"}
          </p>
        </div>
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Price point</p>
            <p className="mt-1 font-semibold text-foreground">{formatPrice(developer.minPrice)}</p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Live stock</p>
            <p className="mt-1 font-semibold text-foreground">{developer.listingCount || 0}</p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Private stock</p>
            <p className="mt-1 font-semibold text-foreground">{developer.privateInventoryCount || 0}</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Where to start</p>
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {developer.topAreas.slice(0, 3).map((area) => (
            <span key={area} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {area}
            </span>
          ))}
          {!developer.topAreas.length ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50/70 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Approved in Dubai
            </span>
          ) : null}
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild className="flex-1 rounded-full">
            <Link to={`/developers/${developer.slug}`}>View developer</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 rounded-full">
            <Link to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}`}>
              View properties
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
