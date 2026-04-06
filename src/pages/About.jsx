import React from "react";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

const principles = [
  {
    title: "Sale-only advisory",
    description: "DubaiSphere is built around property purchase. We do not split focus across rental marketplace behaviour.",
  },
  {
    title: "Developer-aligned execution",
    description: "Listings and project pages are structured to support direct, informed purchase decisions and developer-facing deal progression.",
  },
  {
    title: "Private client capability",
    description: "Off-plan, private inventory, Golden Visa, and concierge routes are handled within a governed buyer workflow.",
  },
];

export default function About() {
  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="About DubaiSphere"
        description="Learn how DubaiSphere approaches Dubai property purchase, developer-aligned execution, and premium buyer advisory."
        canonicalPath="/about"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ])}
      />

      <SectionHeading
        eyebrow="About"
        title="A purchase-first Dubai real estate platform"
        description="DubaiSphere is structured around guided property acquisition, not open marketplace clutter. The public site stays buyer-facing while the back office manages developers, projects, listings, and execution."
        titleAs="h1"
        action={(
          <Button asChild className="rounded-full px-5">
            <Link to="/properties">Open property directory</Link>
          </Button>
        )}
      />

      <div className="grid gap-5 md:grid-cols-3">
        {principles.map((item) => (
          <Card key={item.title} className="rounded-[1.8rem] border-white/10 bg-card/90">
            <CardContent className="space-y-3 p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{item.title}</h2>
              <p className="text-sm leading-7 text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">What makes the model different</h2>
          <p className="text-sm leading-7 text-muted-foreground">
            The public experience is designed to help buyers search, compare, shortlist, and enquire with clarity. Behind that, the platform manages developer relationships, project visibility, listing governance, concierge handling, and revenue control without exposing operational noise to the client.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
