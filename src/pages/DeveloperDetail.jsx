import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  Layers3,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import ListingCard from "@/components/buyer/ListingCard";
import ProjectSpotlightCard from "@/components/buyer/ProjectSpotlightCard";
import SeoMeta from "@/components/seo/SeoMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import { loadBuyerListings } from "@/lib/buyerListings";
import { getDeveloperProfileBySlug, hydrateDeveloperProfile, listDeveloperProfiles } from "@/lib/developerProfiles";
import { buildManagedProjectDirectory, listProjectProfiles } from "@/lib/projectProfiles";
import { buildBreadcrumbJsonLd, truncateSeoDescription } from "@/lib/seo";

function formatPrice(value) {
  if (!value) return "On request";
  return `AED ${Number(value).toLocaleString()}`;
}

function buildPriceBand(developer) {
  if (!developer?.minPrice && !developer?.maxPrice) return "On request";
  if (!developer?.maxPrice || developer.minPrice === developer.maxPrice) return formatPrice(developer.minPrice || developer.maxPrice);
  return `${formatPrice(developer.minPrice)} - ${formatPrice(developer.maxPrice)}`;
}

function DetailRow({ label, value, action }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 py-3 last:border-b-0 last:pb-0">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
      </div>
      {action}
    </div>
  );
}

function FactTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 stroke-[2.4]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

export default function DeveloperDetail() {
  const { slug } = useParams();
  const { data: approvedDevelopers = [] } = useApprovedDevelopers();
  const { data: listings = [] } = useQuery({
    queryKey: ["developer-detail-listings", slug],
    queryFn: () => loadBuyerListings({ limit: 200, includeShowcase: true }),
    initialData: [],
  });
  const { data: profile } = useQuery({
    queryKey: ["developer-profile", slug],
    queryFn: () => getDeveloperProfileBySlug(slug),
    enabled: !!slug,
    initialData: null,
  });
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["developer-project-developer-profiles"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["developer-project-profiles", slug],
    queryFn: () => listProjectProfiles(),
    initialData: [],
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["developer-project-records", slug],
    queryFn: async () => {
      try {
        return await base44.entities.Project.list("-updated_date", 200);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const developer = profile && profile.partnership_status === "partnered" && profile.page_status === "published"
    ? hydrateDeveloperProfile(profile, approvedDevelopers, listings)
    : null;

  const relatedProjects = useMemo(() => {
    if (!developer) return [];
    return buildManagedProjectDirectory(projectProfiles, projects, listings, developerProfiles)
      .filter((project) => (
        project.developerSlug === developer.slug
        || project.developerName === developer.name
        || project.developerName === developer.officialName
      ))
      .slice(0, 6);
  }, [developer, developerProfiles, listings, projectProfiles, projects]);

  const featuredListings = developer?.listings?.slice(0, 6) || [];
  const featuredAreas = developer?.topAreas || [];
  const portfolioNotes = useMemo(() => {
    if (!developer) return [];
    return [
      `${developer.name} currently has ${developer.listingCount} homes available on the public site.`,
      developer.offPlanCount
        ? `${developer.offPlanCount} off-plan home${developer.offPlanCount === 1 ? "" : "s"} is currently linked to this page.`
        : "Most of the homes shown here are ready or easier to review straight away.",
      developer.privateInventoryCount
        ? `${developer.privateInventoryCount} private listing${developer.privateInventoryCount === 1 ? " is" : "s are"} also linked to this page.`
        : "Private listings can also be handled separately when needed.",
      featuredAreas.length
        ? `The main areas linked to this developer are ${featuredAreas.join(", ")}.`
        : "Area highlights can be added here as more content is published.",
    ];
  }, [developer, featuredAreas]);

  if (!developer) {
    return (
      <>
        <SeoMeta
          title="Developer Profile Not Found"
          description="The requested developer profile could not be found."
          canonicalPath={`/developers/${slug}`}
          robots="noindex,nofollow"
        />
        <div className="space-y-4 pb-28">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Developer profile not found</h1>
          <p className="text-sm text-slate-600">This developer page is not live yet.</p>
          <Button asChild className="rounded-full px-5">
            <Link to="/developers">Back to developers</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoMeta
        title={`${developer.name} Dubai Properties and Projects`}
        description={truncateSeoDescription(
          developer.summary
          || `${developer.name} has ${developer.listingCount} homes currently available${featuredAreas.length ? ` across ${featuredAreas.join(", ")}` : ""}, with linked projects and property pages.`
        )}
        canonicalPath={`/developers/${slug}`}
        robots="index,follow"
        image={developer.heroImageUrl}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Developers", path: "/developers" },
          { name: developer.name, path: `/developers/${slug}` },
        ])}
      />

      <div className="space-y-6 pb-28">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="space-y-5">
              <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="relative aspect-[16/11] bg-slate-100">
                    {developer.heroImageUrl ? (
                      <img src={developer.heroImageUrl} alt={developer.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-white/10">
                          <Building2 className="h-9 w-9" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.72))]" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-slate-950 px-3.5 py-1.5 text-white hover:bg-slate-950">
                        Developer profile
                      </Badge>
                      <Badge className="rounded-full border border-white/60 bg-white/90 px-3.5 py-1.5 text-slate-900 hover:bg-white">
                        Sale only
                      </Badge>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">{developer.name}</h1>
                      <p className="mt-3 max-w-3xl text-sm leading-7 text-white/78">
                        {developer.summary || "Browse the developer, explore their featured projects, and then view the homes currently available."}
                      </p>
                    </div>
                  </div>

                  <div className="hidden border-l border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 lg:flex lg:flex-col lg:justify-between">
                    <div className="space-y-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Portfolio summary</p>
                      <div>
                        <p className="text-3xl font-semibold tracking-tight text-slate-950">{buildPriceBand(developer)}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {developer.primaryCity || "Dubai"} developer page with projects and homes for sale.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <DetailRow label="Active stock" value={String(developer.listingCount || 0)} />
                        <DetailRow label="Off-plan stock" value={String(developer.offPlanCount || 0)} />
                        <DetailRow label="Private inventory" value={String(developer.privateInventoryCount || 0)} />
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">What this page does</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        It helps buyers understand the developer first, then move into the right projects and available homes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                  Partnered profile
                </Badge>
                {developer.primaryCity ? (
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                    {developer.primaryCity}
                  </Badge>
                ) : null}
                {featuredAreas.slice(0, 2).map((area) => (
                  <Badge key={area} variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                    {area}
                  </Badge>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <FactTile icon={Layers3} label="Developer projects" value={String(relatedProjects.length)} />
                <FactTile icon={Building2} label="Live listings" value={String(developer.listingCount || 0)} />
                <FactTile icon={Sparkles} label="Off-plan stock" value={String(developer.offPlanCount || 0)} />
                <FactTile icon={ShieldCheck} label="Private inventory" value={String(developer.privateInventoryCount || 0)} />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6 lg:p-7">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Brand story</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">About this developer</h2>
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    {developer.body || developer.summary || "This section introduces the developer, the kind of homes they build, and where buyers are most likely to find them."}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6 lg:p-7">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Portfolio snapshot</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">At a glance</h2>
                  </div>
                  <div className="space-y-1">
                    <DetailRow label="Brand name" value={developer.officialName || developer.name} />
                    <DetailRow label="Primary city" value={developer.primaryCity || "Dubai"} />
                    <DetailRow label="Price band" value={buildPriceBand(developer)} />
                    <DetailRow label="Projects" value={String(relatedProjects.length || 0)} />
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <CardContent className="space-y-5 p-6 lg:p-7">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Buyer perspective</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">What buyers can expect here</h2>
                </div>
                <div className="space-y-3">
                  {portfolioNotes.map((note) => (
                    <div key={note} className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
                      {note}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {featuredAreas.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Top areas</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Popular areas for this developer</h2>
                  </div>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}`}>
                      View all matching stock
                      <ArrowUpRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {featuredAreas.map((area) => (
                    <Link
                      key={area}
                      to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}&q=${encodeURIComponent(area)}`}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
                    >
                      <MapPin className="h-4 w-4" />
                      {area}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {relatedProjects.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Related projects</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Projects currently published for {developer.name}</h2>
                  </div>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to="/projects">All projects</Link>
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {relatedProjects.map((project) => (
                    <ProjectSpotlightCard key={project.slug} project={project} />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Linked sale stock</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Homes currently shown for this developer</h2>
                </div>
                <Button asChild variant="outline" className="rounded-full px-5">
                  <Link to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}`}>
                    Open property directory
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {featuredListings.length ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {featuredListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No active sale stock is currently linked to this developer profile.</p>
              )}
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Developer summary</p>
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">{buildPriceBand(developer)}</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="font-medium text-slate-950">{developer.name}</p>
                    <p>{developer.primaryCity || "Dubai"} developer page with featured projects and homes.</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {developer.listingCount} live listing{developer.listingCount === 1 ? "" : "s"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {developer.offPlanCount} off-plan home{developer.offPlanCount === 1 ? "" : "s"}
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {developer.privateInventoryCount} private inventory
                  </div>
                  {featuredAreas[0] ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Strongest area: {featuredAreas[0]}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2.5">
                  <Button asChild className="h-11 rounded-full">
                    <Link to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}`}>
                      View properties
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-full">
                    <Link to="/contact">Contact us</Link>
                  </Button>
                  <Button asChild variant="outline" className="h-11 rounded-full">
                    <Link to="/projects">Browse projects</Link>
                  </Button>
                </div>

                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Related pages</p>
                  <div className="grid gap-2">
                    <Button asChild variant="outline" className="justify-between rounded-full px-4">
                      <Link to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}`}>
                        Property directory
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-between rounded-full px-4">
                      <Link to="/projects">
                        Project directory
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-between rounded-full px-4">
                      <Link to="/contact">
                        Contact us
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
