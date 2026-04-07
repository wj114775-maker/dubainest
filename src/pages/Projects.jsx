import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import ProjectSpotlightCard from "@/components/buyer/ProjectSpotlightCard";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
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
