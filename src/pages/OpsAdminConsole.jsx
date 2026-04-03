import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listEntitySafe } from "@/lib/base44Safeguards";

export default function OpsAdminConsole() {
  const [showAllTools, setShowAllTools] = useState(false);
  const { data = { groups: [], modules: [], summary: [] } } = useQuery({
    queryKey: ["ops-admin-console-modules"],
    queryFn: async () => {
      const [roles, bundles, permissions, configs] = await Promise.all([
        listEntitySafe("Role", "-updated_date", 200),
        listEntitySafe("PermissionBundle", "-updated_date", 200),
        listEntitySafe("Permission", "-updated_date", 200),
        listEntitySafe("AppConfig", "-updated_date", 10),
      ]);

      return {
        groups: [
          {
            title: "People and access",
            description: "Invite users, assign access, and control partner entry points.",
            items: [
              { title: "Team access", description: `${roles.length} roles currently govern staff access and lifecycle visibility.`, href: "/ops/users" },
              { title: "Roles and permissions", description: `${bundles.length} bundles and ${permissions.length} permissions are configured.`, href: "/ops/roles-permissions" },
              { title: "Partner access", description: "Partner-side memberships, scope, and verification state.", href: "/ops/partner-access" }
            ]
          },
          {
            title: "Rules and policies",
            description: "Control the governed logic that drives leads, fees, and compliance.",
            items: [
              { title: "Lead rules", description: "Ownership, attribution, and anti-circumvention governance.", href: "/ops/lead-rules" },
              { title: "Commission rules", description: "Commercial policy used by the money desk.", href: "/ops/commission-rules" },
              { title: "Compliance rules", description: "Verification triggers, freeze policies, and service SLAs.", href: "/ops/compliance-rules" }
            ]
          },
          {
            title: "Security and system",
            description: "Use these tools only for setup, security, and platform-level controls.",
            items: [
              { title: "Security", description: "Force logout, MFA reset, and password enforcement controls.", href: "/ops/security" },
              { title: "System settings", description: `${configs.length} platform configuration records are available for governance.`, href: "/ops/settings" }
            ]
          }
        ],
        modules: [
          { title: "Team access", description: `${roles.length} roles currently govern user access and lifecycle visibility.`, href: "/ops/users", meta: "People" },
          { title: "Roles & Permissions", description: `${bundles.length} bundles and ${permissions.length} permissions are configured.`, href: "/ops/roles-permissions", meta: "RBAC" },
          { title: "Partner Access", description: "Partner-side memberships, access scope and verification state.", href: "/ops/partner-access", meta: "Partner" },
          { title: "Security", description: "Force logout, MFA reset and password reset enforcement controls.", href: "/ops/security", meta: "Security" },
          { title: "Lead Rules", description: "Event-driven ownership, attribution and anti-circumvention governance.", href: "/ops/lead-rules", meta: "Lead" },
          { title: "Commission Rules", description: "Explicit commission policy management for payout traceability.", href: "/ops/commission-rules", meta: "Revenue" },
          { title: "Compliance Rules", description: "Case triggers, freeze policies and SLA governance.", href: "/ops/compliance-rules", meta: "Compliance" },
          { title: "System Settings", description: `${configs.length} platform configuration records are available for governance.`, href: "/ops/settings", meta: "System" },
        ],
        summary: [
          { label: "Roles", value: String(roles.length) },
          { label: "Bundles", value: String(bundles.length) },
          { label: "Permissions", value: String(permissions.length) },
          { label: "Configs", value: String(configs.length) }
        ]
      };
    },
    initialData: { groups: [], modules: [], summary: [] },
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Control center"
        title="Setup, access, rules, and security"
        description="This page is now organised as plain-language control groups. Most staff should not need to be here during normal daily work."
        action={<Button variant="outline" onClick={() => setShowAllTools((current) => !current)}>{showAllTools ? "Hide full tool list" : "Show full tool list"}</Button>}
      />
      <AdminSummaryStrip items={data.summary} />
      <div className="grid gap-4 xl:grid-cols-3">
        {data.groups.map((group) => (
          <Card key={group.title} className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{group.description}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map((item) => (
                <Link key={item.href} to={item.href} className="block rounded-[1.25rem] border border-white/10 bg-background/40 p-4 transition hover:bg-muted/40">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
      {showAllTools ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {data.modules.map((module) => (
            <Card key={module.href} className="rounded-[1.8rem] border-white/10 bg-card/70">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold tracking-tight">{module.title}</h3>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{module.meta}</span>
                </div>
                <p className="text-sm text-muted-foreground">{module.description}</p>
                <Button variant="outline" asChild><Link to={module.href}>Open</Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
