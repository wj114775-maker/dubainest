import React from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

const publicGroups = [
  {
    title: "Browse",
    links: [
      { label: "Home", path: "/" },
      { label: "Properties", path: "/properties" },
      { label: "Developers", path: "/developers" },
      { label: "Areas", path: "/areas" },
      { label: "Guides", path: "/guides" },
      { label: "Golden Visa", path: "/golden-visa" },
    ]
  },
  {
    title: "Buyer tools",
    links: [
      { label: "Buyer Qualification", path: "/quiz" },
      { label: "Shortlist", path: "/shortlist" },
      { label: "Compare", path: "/compare" },
      { label: "Account", path: "/account" },
    ]
  },
  {
    title: "Site",
    links: [
      { label: "Site map", path: "/sitemap" },
    ]
  }
];

export default function SiteFooter({ appName }) {
  return (
    <footer className="border-t border-white/10 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr,1fr,1fr,1fr] md:px-6">
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
          <p className="max-w-md text-sm text-muted-foreground">
            Browse the public application here. Use the workspace route only when you are signed in with internal or partner access.
          </p>
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
