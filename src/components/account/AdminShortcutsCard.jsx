import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Briefcase, LayoutDashboard, Gem, Building2, WalletCards } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const shortcuts = [
  { label: "Open Home", path: "/ops", icon: LayoutDashboard },
  { label: "Open Buyers", path: "/ops/leads", icon: Briefcase },
  { label: "Open Listings", path: "/ops/listings", icon: Building2 },
  { label: "Open Premium", path: "/ops/concierge", icon: Gem },
  { label: "Open Money", path: "/ops/revenue", icon: WalletCards },
  { label: "Open Control Center", path: "/ops/admin", icon: ShieldCheck },
];

export default function AdminShortcutsCard() {
  return (
    <Card className="rounded-[2rem] border-primary/15 bg-card/80 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle>Operations menu shortcuts</CardTitle>
        <CardDescription>Daily work stays in Home, Buyers, Listings, Premium, and Money. Setup stays in Control Center.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-muted/30 px-4 py-4 text-sm transition hover:bg-muted">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
