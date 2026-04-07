import React from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarClock, MapPin } from "lucide-react";
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
    <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-card/90 shadow-xl shadow-black/5">
      <div className="h-52 bg-muted">
        {project.heroImageUrl ? (
          <img src={project.heroImageUrl} alt={project.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white/10">
              <Building2 className="h-7 w-7" />
            </div>
          </div>
        )}
      </div>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap gap-2">
          <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">{formatProjectStatus(project.status)}</Badge>
          {project.handoverLabel ? <Badge variant="outline" className="rounded-full">Handover {project.handoverLabel}</Badge> : null}
        </div>

        <div>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">{project.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{project.summary || "Governed off-plan or project profile."}</p>
        </div>

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
          <div className="rounded-[1.2rem] bg-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Price from</p>
            <p className="mt-1 font-semibold text-foreground">{formatPrice(project.priceFrom)}</p>
          </div>
          <div className="rounded-[1.2rem] bg-muted/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Unit types</p>
            <p className="mt-1 font-semibold text-foreground">{project.unitTypes?.slice(0, 2).join(", ") || "Available"}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild className="flex-1 rounded-full">
            <Link to={`/projects/${project.slug}`}>View project</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1 rounded-full">
            <Link to={`/properties?q=${encodeURIComponent(project.name || project.areaName || "Dubai project")}`}>View stock</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
