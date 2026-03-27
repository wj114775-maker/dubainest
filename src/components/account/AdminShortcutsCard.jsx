import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Users, Briefcase, Lock, ScrollText, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const shortcuts = [
  { label: "Open Internal OS", path: "/ops", icon: LayoutDashboard },
  { label: "Open Admin Console", path: "/ops/admin", icon: ShieldCheck },
  { label: "Open Leads", path: "/ops/leads", icon: Briefcase },
  { label: "Open Users", path: "/ops/users", icon: Users },
  { label: "Open Security", path: "/ops/security", icon: Lock },
  { label: "Open Audit", path: "/ops/audit", icon: ScrollText },
];

export default function AdminShortcutsCard() {
  return (
    <Card className="rounded-[2rem] border-primary/15 bg-card/80 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle>Internal admin workspace</CardTitle>
        <CardDescription>You are signed in with admin access. Open the control area below.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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