import React from "react";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

const groups = [
  {
    title: "Public pages",
    links: [
      { label: "Home", path: "/" },
      { label: "Properties", path: "/properties" },
      { label: "Guides", path: "/guides" },
      { label: "Golden Visa", path: "/golden-visa" },
      { label: "Buyer Qualification", path: "/quiz" },
      { label: "Shortlist", path: "/shortlist" },
      { label: "Compare", path: "/compare" },
      { label: "Site map", path: "/sitemap" },
    ],
  },
];

export default function SiteMap() {
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
