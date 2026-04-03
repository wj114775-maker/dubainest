import React from "react";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const groups = [
  {
    title: "Public pages",
    links: [
      { label: "Home", path: "/" },
      { label: "Properties", path: "/properties" },
      { label: "Guides", path: "/guides" },
      { label: "Golden Visa", path: "/golden-visa" },
      { label: "Shortlist", path: "/shortlist" },
      { label: "Compare", path: "/compare" },
      { label: "Account", path: "/account" },
      { label: "Notifications", path: "/notifications" },
    ],
  },
  {
    title: "Workspace entry points",
    links: [
      { label: "Workspace router", path: "/workspace" },
      { label: "Partner workspace", path: "/partner" },
      { label: "Operations workspace", path: "/ops" },
    ],
  },
];

export default function SiteMap() {
  return (
    <div className="space-y-6 pb-28">
      <SectionHeading
        eyebrow="Site map"
        title="A clearer index of the application"
        description="Use this page as a simple route directory while the platform grows."
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
