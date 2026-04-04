import React from "react";
import { Link } from "react-router-dom";
import { Building2, MapPin, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatPrice(value) {
  if (!value) return "Price on request";
  return `From AED ${Number(value).toLocaleString()}`;
}

export default function DeveloperSpotlightCard({ developer }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-card/90 shadow-xl shadow-black/5">
      <div className="h-48 bg-muted">
        {developer.heroImageUrl ? (
          <img src={developer.heroImageUrl} alt={developer.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white/10">
              <Building2 className="h-7 w-7" />
            </div>
          </div>
        )}
      </div>
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-primary">Developer</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{developer.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {developer.listingCount
              ? `${developer.listingCount} active properties, ${developer.offPlanCount} off-plan, ${developer.readyCount} ready`
              : "Approved developer profile"}
          </p>
        </div>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-[1.2rem] bg-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Price point</p>
            <p className="mt-1 font-semibold text-foreground">{formatPrice(developer.minPrice)}</p>
          </div>
          <div className="rounded-[1.2rem] bg-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Private stock</p>
            <p className="mt-1 font-semibold text-foreground">{developer.privateInventoryCount || 0}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {developer.topAreas.slice(0, 3).map((area) => (
            <span key={area} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {area}
            </span>
          ))}
          {!developer.topAreas.length ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Approved in Dubai
            </span>
          ) : null}
        </div>

        <div className="flex gap-3">
          <Button asChild className="flex-1 rounded-full">
            <Link to={`/developers/${developer.slug}`}>View developer</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 rounded-full">
            <Link to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}`}>View properties</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
