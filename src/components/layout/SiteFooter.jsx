import React from "react";
import { Link } from "react-router-dom";
import { Building2, Compass, Gem, ShieldCheck } from "lucide-react";

const publicGroups = [
  {
    title: "Browse",
    links: [
      { label: "Home", path: "/" },
      { label: "Properties", path: "/properties" },
      { label: "Guides", path: "/guides" },
      { label: "Golden Visa", path: "/golden-visa" },
    ]
  },
  {
    title: "Planning",
    links: [
      { label: "Shortlist", path: "/shortlist" },
      { label: "Compare", path: "/compare" },
      { label: "Account", path: "/account" },
      { label: "Notifications", path: "/notifications" },
    ]
  },
  {
    title: "Platform",
    links: [
      { label: "Site map", path: "/sitemap" },
      { label: "Partner workspace", path: "/partner" },
      { label: "Operations workspace", path: "/workspace" },
    ]
  }
];

export default function SiteFooter({ appName, showInternalAccess = false }) {
  return (
    <footer className="border-t border-white/10 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.4fr,1fr,1fr,1fr] md:px-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">{appName}</p>
              <p className="text-sm text-muted-foreground">
                Verified Dubai property discovery with workspace-grade operations behind it.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.4rem] border border-white/10 bg-background/70 p-4">
              <Compass className="h-4 w-4 text-primary" />
              <p className="mt-3 text-sm font-medium text-foreground">Buyer-friendly navigation</p>
              <p className="mt-1 text-sm text-muted-foreground">Explore, search, shortlist, and move forward without guessing where to click next.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-background/70 p-4">
              <Gem className="h-4 w-4 text-primary" />
              <p className="mt-3 text-sm font-medium text-foreground">Premium pathways</p>
              <p className="mt-1 text-sm text-muted-foreground">Private inventory, concierge, and HNW handling stay discoverable but controlled.</p>
            </div>
            <div className="rounded-[1.4rem] border border-white/10 bg-background/70 p-4">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="mt-3 text-sm font-medium text-foreground">Workspace separation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {showInternalAccess ? "Your internal workspace is linked above through Workspace." : "Internal operations stay separate from the public browsing layer."}
              </p>
            </div>
          </div>
        </div>

        {publicGroups.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {group.title}
            </p>
            <div className="mt-4 space-y-3">
              {group.links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}
