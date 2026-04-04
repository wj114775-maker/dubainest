import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import AreaSpotlightCard from "@/components/buyer/AreaSpotlightCard";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export default function Areas() {
  const { data: areas = [] } = useQuery({
    queryKey: ["areas-directory"],
    queryFn: () => base44.entities.Area.list("-updated_date", 100),
    initialData: [],
  });

  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Dubai Areas and Neighbourhood Guides"
        description="Explore Dubai neighbourhoods, area intelligence, and buyer-focused area guidance before choosing a property."
        canonicalPath="/areas"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Areas", path: "/areas" },
        ])}
      />
      <SectionHeading
        eyebrow="Areas"
        title="Explore Dubai areas before you choose stock"
        description="Area pages help buyers narrow by neighbourhood, lifestyle fit, and market positioning before they commit to listings."
        action={
          <Button asChild className="rounded-full px-5">
            <Link to="/properties">Open property directory</Link>
          </Button>
        }
      />

      {areas.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => (
            <AreaSpotlightCard key={area.id} area={area} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No area pages are available yet.</p>
      )}
    </div>
  );
}
