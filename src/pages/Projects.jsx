import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarClock, Layers3, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import ProjectSpotlightCard from "@/components/buyer/ProjectSpotlightCard";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadBuyerListings } from "@/lib/buyerListings";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { buildManagedProjectDirectory, listProjectProfiles } from "@/lib/projectProfiles";

export default function Projects() {
  const { data: listings = [] } = useQuery({
    queryKey: ["projects-directory-listings"],
    queryFn: () => loadBuyerListings({ limit: 200, includeShowcase: true }),
    initialData: [],
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["projects-directory-records"],
    queryFn: async () => {
      try {
        return await base44.entities.Project.list("-updated_date", 200);
      } catch {
        return [];
      }
    },
    initialData: [],
  });
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["project-profiles-public"],
    queryFn: () => listProjectProfiles(),
    initialData: [],
  });
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["project-directory-developer-profiles"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });

  const directory = useMemo(
    () => buildManagedProjectDirectory(projectProfiles, projects, listings, developerProfiles),
    [developerProfiles, listings, projectProfiles, projects]
  );
  const summary = useMemo(() => ({
    projectCount: directory.length,
    unitCount: directory.reduce((sum, project) => sum + Number(project.featuredListings?.length || 0), 0),
    offPlanCount: directory.filter((project) => project.status === "under_construction" || project.status === "planned").length,
    readyCount: directory.filter((project) => project.status === "completed").length,
  }), [directory]);

  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Dubai New Projects and Off-Plan Property Opportunities"
        description="Browse governed Dubai project pages for off-plan launches, under-construction opportunities, and flagship developments available through DubaiSphere."
        canonicalPath="/projects"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
        ])}
      />
      <SectionHeading
        eyebrow="Projects"
        title="Explore governed project pages before drilling into individual listings"
        description="Project pages carry launch context, handover timing, payment-plan positioning, and linked live inventory without exposing projects you do not actively manage."
        titleAs="h1"
        action={(
          <Button asChild className="rounded-full px-5">
            <Link to="/off-plan">Open off-plan overview</Link>
          </Button>
        )}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_360px]">
        <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-5 p-6 lg:p-7">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Launch directory</p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Project pages sit between brand trust and listing-level choice.</h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                This index is meant to carry launch context, handover timing, price range, and linked inventory before the buyer drills into a specific property page. It should feel governed and premium rather than portal-like.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Project pages</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{summary.projectCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Linked units</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{summary.unitCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Launch-stage</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{summary.offPlanCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ready projects</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{summary.readyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-200 bg-[linear-gradient(160deg,#0f172a_0%,#18253a_58%,#1d3147_100%)] text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white/10">
              <Layers3 className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">Project positioning</p>
              <h2 className="text-2xl font-semibold tracking-tight">Launch pages need facts, not noise.</h2>
              <p className="text-sm leading-7 text-white/76">
                A strong project page should explain delivery timing, pricing range, and linked opportunities before the buyer decides which specific listing to pursue.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs text-white/82">
                <CalendarClock className="h-3.5 w-3.5" />
                Handover context
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs text-white/82">
                <Sparkles className="h-3.5 w-3.5" />
                Payment-plan positioning
              </span>
            </div>
            <Button asChild variant="secondary" className="rounded-full bg-white text-slate-950 hover:bg-white/92">
              <Link to="/properties?completion=off_plan">
                Open off-plan stock
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {directory.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {directory.map((project) => (
            <ProjectSpotlightCard key={project.slug} project={project} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No public project pages are available yet.</p>
      )}
    </div>
  );
}
