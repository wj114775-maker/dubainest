import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, MapPin, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AreaSpotlightCard({ area }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div className="relative aspect-[16/11] bg-muted">
        <img src={area.hero_image_url} alt={area.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),rgba(15,23,42,0.72))]" />
        <div className="absolute left-4 top-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur">
            <MapPin className="h-3.5 w-3.5" />
            Area intelligence
          </div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-semibold tracking-tight text-white">{area.name}</h3>
          <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-white/78">{area.description}</p>
        </div>
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Investment signal</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{area.avg_rental_yield ? `${area.avg_rental_yield}%` : "—"}</p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Family score</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{area.family_score || 0}/100</p>
          </div>
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Investor score</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{area.investor_score || 0}/100</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Why start here</p>
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-900" />
                Location-led purchase filtering
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-900" />
                Linked projects and live stock
              </span>
            </div>
          </div>
          <Button asChild variant="outline" className="rounded-full px-5">
            <Link to={`/areas/${area.slug}`}>
              View area intelligence
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
