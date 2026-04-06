import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import GuideCard from "@/components/content/GuideCard";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export default function Guides() {
  const { data: guides = [] } = useQuery({ queryKey: ["guides"], queryFn: () => base44.entities.Guide.filter({ status: "published" }, "-updated_date", 100), initialData: [] });
  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Dubai Property Guides for Buyers and Investors"
        description="Read Dubai property guides covering areas, buying process, relocation planning, and investor support."
        canonicalPath="/guides"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />
      <SectionHeading eyebrow="Guides" title="Dubai property guides for buyers and investors" description="Area insight, buying guidance, and relocation support to help clients move forward with more clarity." titleAs="h1" />
      {guides.length ? <div className="grid gap-5 md:grid-cols-3">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div> : <p className="text-sm text-muted-foreground">No published guides yet.</p>}
    </div>
  );
}
