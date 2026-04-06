import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import DeveloperSpotlightCard from "@/components/buyer/DeveloperSpotlightCard";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Dubai Developers and Active Property Opportunities"
        description="Browse Dubai property developers with live active stock, off-plan opportunities, and direct routes into each developer’s available properties."
        canonicalPath="/developers"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Developers", path: "/developers" },
        ])}
      />
      <SectionHeading
        eyebrow="Developers"
        title="Explore developers behind active Dubai sale opportunities"
        description="Only partnered and published developer profiles appear here. Search filters can remain broader, but public brand pages stay under your control."
        titleAs="h1"
        action={
          <Button asChild className="rounded-full px-5">
            <Link to="/properties">Open property directory</Link>
          </Button>
        }
      />

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
