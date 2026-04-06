import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import { buildListingPath, loadBuyerListings } from "@/lib/buyerListings";
import { buildManagedDeveloperDirectory, listDeveloperProfiles } from "@/lib/developerProfiles";
import { buildManagedProjectDirectory, listProjectProfiles } from "@/lib/projectProfiles";
import { showcaseListingSeoEntries } from "@/data/showcaseSeoCatalog";

const staticGroups = [
  {
    title: "Core pages",
    links: [
      { label: "Home", path: "/" },
      { label: "Properties", path: "/properties" },
      { label: "Projects", path: "/projects" },
      { label: "Developers", path: "/developers" },
      { label: "Areas", path: "/areas" },
      { label: "Guides", path: "/guides" },
      { label: "Golden Visa", path: "/golden-visa" },
      { label: "Buyer Qualification", path: "/quiz" },
      { label: "Site map", path: "/sitemap" },
    ],
  },
];

export default function SiteMap() {
  const { data: approvedDevelopers = [] } = useApprovedDevelopers();
  const { data: guides = [] } = useQuery({
    queryKey: ["sitemap-guides"],
    queryFn: () => base44.entities.Guide.filter({ status: "published" }, "-updated_date", 24),
    initialData: [],
  });
  const { data: areas = [] } = useQuery({
    queryKey: ["sitemap-areas"],
    queryFn: () => base44.entities.Area.list("-updated_date", 24),
    initialData: [],
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["sitemap-listings"],
    queryFn: () => loadBuyerListings({ limit: 60, includeShowcase: true }),
    initialData: [],
  });
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["sitemap-developer-profiles"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["sitemap-project-profiles"],
    queryFn: () => listProjectProfiles(),
    initialData: [],
  });
  const { data: projectRecords = [] } = useQuery({
    queryKey: ["sitemap-project-records"],
    queryFn: async () => {
      try {
        return await base44.entities.Project.list("-updated_date", 100);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const developers = useMemo(
    () => buildManagedDeveloperDirectory(developerProfiles, approvedDevelopers, listings).slice(0, 18),
    [approvedDevelopers, developerProfiles, listings]
  );
  const projects = useMemo(
    () => buildManagedProjectDirectory(projectProfiles, projectRecords, listings, developerProfiles).slice(0, 18),
    [developerProfiles, listings, projectProfiles, projectRecords]
  );

  const groups = useMemo(() => ([
    ...staticGroups,
    {
      title: "Published guides",
      links: guides.map((guide) => ({ label: guide.title, path: `/guides/${guide.slug}` })),
    },
    {
      title: "Area guides",
      links: areas.map((area) => ({ label: area.name, path: `/areas/${area.slug}` })),
    },
    {
      title: "Developers",
      links: developers.map((developer) => ({ label: developer.name, path: `/developers/${developer.slug}` })),
    },
    {
      title: "Projects",
      links: projects.map((project) => ({ label: project.name, path: `/projects/${project.slug}` })),
    },
    {
      title: "Featured properties",
      links: (listings.length
        ? listings.slice(0, 12).map((listing) => ({ label: listing.title, path: buildListingPath(listing) }))
        : showcaseListingSeoEntries.slice(0, 12)
      ),
    },
  ].filter((group) => group.links.length)), [areas, developers, guides, listings, projects]);

  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Site Map"
        description="Browse the main public pages for Dubai property search, guides, visa support, and buyer qualification."
        canonicalPath="/sitemap"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Site Map", path: "/sitemap" },
        ])}
      />
      <SectionHeading
        eyebrow="Site map"
        title="A clearer index of the public website"
        description="Use this page as a simple route directory for the public-facing property search experience."
        titleAs="h1"
      />

      <div className="grid gap-5 md:grid-cols-2">
        {groups.map((group) => (
          <Card key={group.title} className="rounded-[2rem] border-white/10 bg-card/90">
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block rounded-2xl border border-white/10 bg-background/60 px-4 py-3 text-sm text-muted-foreground transition hover:border-primary/25 hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
