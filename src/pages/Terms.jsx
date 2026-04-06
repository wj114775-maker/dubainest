import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Card, CardContent } from "@/components/ui/card";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export default function Terms() {
  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Terms of Use"
        description="Review the terms governing use of the DubaiSphere public site, search tools, and buyer enquiry flows."
        canonicalPath="/terms"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Terms of Use", path: "/terms" },
        ])}
      />

      <SectionHeading
        eyebrow="Terms"
        title="Terms governing the public DubaiSphere website"
        description="The public site is provided for Dubai property purchase search, research, and advisory contact. Internal back office areas remain restricted."
        titleAs="h1"
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
        <CardContent className="space-y-4 p-6 text-sm leading-7 text-muted-foreground">
          <p>Public pages are intended to support research, shortlist building, and buyer enquiry submission for Dubai property purchases.</p>
          <p>Internal workspaces, partner workspaces, and governed operational tools are restricted and must not be accessed without appropriate authorization.</p>
          <p>Availability, pricing, project status, and listing visibility may change as stock is reviewed, verified, or updated.</p>
        </CardContent>
      </Card>
    </div>
  );
}
