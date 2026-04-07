import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, MapPin } from "lucide-react";
import SectionHeading from "@/components/common/SectionHeading";
import DeveloperSpotlightCard from "@/components/buyer/DeveloperSpotlightCard";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import { loadBuyerListings } from "@/lib/buyerListings";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { buildManagedDeveloperDirectory, listDeveloperProfiles } from "@/lib/developerProfiles";

export default function Developers() {
  const { data: approvedDevelopers = [] } = useApprovedDevelopers();
  const { data: listings = [] } = useQuery({
    queryKey: ["developers-directory-listings"],
    queryFn: () => loadBuyerListings({ limit: 200, includeShowcase: true }),
    initialData: [],
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["developer-profiles-public"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });

  const developers = useMemo(() => {
    return buildManagedDeveloperDirectory(profiles, approvedDevelopers, listings);
  }, [approvedDevelopers, listings, profiles]);
  const directorySummary = useMemo(() => ({
    developerCount: developers.length,
    listingCount: developers.reduce((sum, developer) => sum + Number(developer.listingCount || 0), 0),
    offPlanCount: developers.reduce((sum, developer) => sum + Number(developer.offPlanCount || 0), 0),
    privateInventoryCount: developers.reduce((sum, developer) => sum + Number(developer.privateInventoryCount || 0), 0),
  }), [developers]);
  const featuredAreas = useMemo(
    () => Array.from(new Set(developers.flatMap((developer) => developer.topAreas || []))).slice(0, 6),
    [developers]
  );

  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Dubai Developers and Active Property Opportunities"
        description="Browse Dubai developers, explore their featured projects, and view homes currently available for sale."
        canonicalPath="/developers"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Developers", path: "/developers" },
        ])}
      />
      <SectionHeading
        eyebrow="Developers"
        title="Explore developers behind featured Dubai properties"
        description="Browse the developer pages you have chosen to show publicly, then move into their projects and available homes."
        titleAs="h1"
        action={
          <Button asChild className="rounded-full px-5">
            <Link to="/properties">Open property directory</Link>
          </Button>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_360px]">
        <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <CardContent className="space-y-5 p-6 lg:p-7">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Directory overview</p>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Developer pages should help buyers quickly understand who builds what.</h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                Each page should give buyers a simple overview of the developer, the best-known areas, active projects, and homes currently for sale.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Developer pages</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{directorySummary.developerCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Live stock</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{directorySummary.listingCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Off-plan stock</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{directorySummary.offPlanCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Private inventory</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{directorySummary.privateInventoryCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-200 bg-[linear-gradient(160deg,#0f172a_0%,#18253a_58%,#1d3147_100%)] text-white shadow-[0_28px_80px_rgba(15,23,42,0.18)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white/10">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">Why this matters</p>
              <h2 className="text-2xl font-semibold tracking-tight">Many buyers know the developer before they know the exact property.</h2>
              <p className="text-sm leading-7 text-white/76">
                This page helps turn that brand recognition into a clear next step: view the project, then view the homes available in it.
              </p>
            </div>
            {featuredAreas.length ? (
              <div className="flex flex-wrap gap-2">
                {featuredAreas.map((area) => (
                  <span key={area} className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs text-white/82">
                    <MapPin className="h-3.5 w-3.5" />
                    {area}
                  </span>
                ))}
              </div>
            ) : null}
            <Button asChild variant="secondary" className="rounded-full bg-white text-slate-950 hover:bg-white/92">
              <Link to="/projects">
                Browse project pages
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {developers.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {developers.map((developer) => (
            <DeveloperSpotlightCard key={developer.slug} developer={developer} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No developer profiles with active stock are available yet.</p>
      )}
    </div>
  );
}
