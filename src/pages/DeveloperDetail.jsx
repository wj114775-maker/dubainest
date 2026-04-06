import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Building2, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
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
  const featuredListings = developer?.listings?.slice(0, 6) || [];
  const relatedProjects = developer ? buildManagedProjectDirectory(projectProfiles, projects, listings, developerProfiles)
    .filter((project) => project.developerSlug === developer.slug || project.developerName === developer.name || project.developerName === developer.officialName)
    .slice(0, 6) : [];

  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title={`${developer?.name || "Developer"} Properties and Off-Plan Opportunities`}
        description={truncateSeoDescription(
          developer
            ? `${developer.name} has ${developer.listingCount} active Dubai properties${developer.topAreas.length ? ` across ${developer.topAreas.join(", ")}` : ""}, including ${developer.offPlanCount} off-plan opportunities.`
            : "Developer profile not found."
        )}
        canonicalPath={`/developers/${slug}`}
        robots={developer ? "index,follow" : "noindex,nofollow"}
        image={developer?.heroImageUrl}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Developers", path: "/developers" },
          { name: developer?.name || "Developer", path: `/developers/${slug}` },
        ])}
      />

      {!developer ? (
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Developers"
            title="Developer profile not found"
            description="This developer page is not available yet."
            titleAs="h1"
          />
          <Button asChild className="rounded-full px-5">
            <Link to="/developers">Back to developers</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-[2rem] border border-white/10">
            {developer.heroImageUrl ? (
              <img src={developer.heroImageUrl} alt={developer.name} className="h-[280px] w-full object-cover md:h-[380px]" />
            ) : (
              <div className="flex h-[280px] items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white md:h-[380px]">
                <div className="flex h-24 w-24 items-center justify-center rounded-[1.8rem] bg-white/10">
                  <Building2 className="h-10 w-10" />
                </div>
              </div>
            )}
          </div>

          <SectionHeading
            eyebrow="Developer profile"
            title={developer.name}
            description={developer.summary || `${developer.listingCount} active opportunities, ${developer.offPlanCount} off-plan, ${developer.readyCount} ready, and ${developer.privateInventoryCount} private inventory options.`}
            titleAs="h1"
            action={
              <div className="flex gap-3">
                <Button asChild className="rounded-full px-5">
                  <Link to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}`}>View properties</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-5">
                  <Link to="/developers">All developers</Link>
                </Button>
              </div>
            }
          />

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Listings {developer.listingCount}</Badge>
            <Badge variant="outline">Off-plan {developer.offPlanCount}</Badge>
            <Badge variant="outline">Ready {developer.readyCount}</Badge>
            {developer.officeNumber ? <Badge variant="outline">Office {developer.officeNumber}</Badge> : null}
          </div>

          {developer.body ? (
            <Card className="rounded-[1.8rem] border-white/10 bg-card/90">
              <CardContent className="p-6">
                <p className="text-sm leading-7 text-muted-foreground">{developer.body}</p>
              </CardContent>
            </Card>
          ) : null}

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-[1.6rem] border-white/10 bg-card/90">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Price from</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{formatPrice(developer.minPrice)}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.6rem] border-white/10 bg-card/90">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Highest stock</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{developer.topAreas[0] || "Dubai"}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.6rem] border-white/10 bg-card/90">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Private inventory</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{developer.privateInventoryCount}</p>
              </CardContent>
            </Card>
            <Card className="rounded-[1.6rem] border-white/10 bg-card/90">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Price ceiling</p>
                <p className="mt-2 text-xl font-semibold text-foreground">{formatPrice(developer.maxPrice)}</p>
              </CardContent>
            </Card>
          </div>

          {developer.topAreas.length ? (
            <section className="space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Top areas for {developer.name}</h2>
              <div className="flex flex-wrap gap-2">
                {developer.topAreas.map((area) => (
                  <Link
                    key={area}
                    to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}&q=${encodeURIComponent(area)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
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
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Projects by {developer.name}</h2>
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
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Properties by {developer.name}</h2>
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to={`/properties?developer=${encodeURIComponent(developer.officialName || developer.name)}`}>See all matching stock</Link>
              </Button>
            </div>
            {featuredListings.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featuredListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active properties are currently linked to this developer.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
