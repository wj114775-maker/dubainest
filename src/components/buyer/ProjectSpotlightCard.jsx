import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, CalendarClock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatPrice(value) {
  if (!value) return "On request";
  return `From AED ${Number(value).toLocaleString()}`;
}

function formatProjectStatus(status) {
  return String(status || "planned").replace(/_/g, " ");
}

export default function ProjectSpotlightCard({ project }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div className="relative h-56 bg-muted">
        {project.heroImageUrl ? (
          <img src={project.heroImageUrl} alt={project.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white/10">
              <Building2 className="h-7 w-7" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.04),rgba(15,23,42,0.72))]" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badge className="rounded-full bg-slate-950 px-3.5 py-1.5 text-white hover:bg-slate-950">{formatProjectStatus(project.status)}</Badge>
          {project.handoverLabel ? <Badge className="rounded-full border border-white/60 bg-white/90 px-3.5 py-1.5 text-slate-900 hover:bg-white">Handover {project.handoverLabel}</Badge> : null}
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-semibold tracking-tight text-white">{project.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/78">{project.summary || "Governed off-plan or project profile."}</p>
        </div>
      </div>
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {project.areaName ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {project.areaName}
            </span>
          ) : null}
          {project.developerName ? (
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {project.developerName}
            </span>
          ) : null}
          {project.handoverLabel ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" />
              {project.handoverLabel}
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Price from</p>
            <p className="mt-1 font-semibold text-foreground">{formatPrice(project.priceFrom)}</p>
          </div>
          <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Unit types</p>
            <p className="mt-1 font-semibold text-foreground">{project.unitTypes?.slice(0, 2).join(", ") || "Available"}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild className="flex-1 rounded-full">
            <Link to={`/projects/${project.slug}`}>View project</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 rounded-full">
            <Link to={`/properties?q=${encodeURIComponent(project.name || project.areaName || "Dubai project")}`}>
              View stock
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
