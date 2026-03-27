import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AdminModuleCard from "@/components/admin/AdminModuleCard";

export default function OpsAdminConsole() {
  const { data: modules = [] } = useQuery({
    queryKey: ["ops-admin-console-modules"],
    queryFn: async () => {
      const [roles, bundles, permissions, configs] = await Promise.all([
        base44.entities.Role.list("-updated_date", 200),
        base44.entities.PermissionBundle.list("-updated_date", 200),
        base44.entities.Permission.list("-updated_date", 200),
        base44.entities.AppConfig.list("-updated_date", 10),
      ]);

      return [
        { title: "Users", description: `${roles.length} roles currently govern user access and lifecycle visibility.`, href: "/ops/users", meta: "Identity" },
        { title: "Roles & Permissions", description: `${bundles.length} bundles and ${permissions.length} permissions are configured.`, href: "/ops/roles-permissions", meta: "RBAC" },
        { title: "Partner Access", description: "Partner-side memberships, access scope and verification state.", href: "/ops/partner-access", meta: "Partner" },
        { title: "Security", description: "Force logout, MFA reset and password reset enforcement controls.", href: "/ops/security", meta: "Security" },
        { title: "Lead Rules", description: "Event-driven ownership, attribution and anti-circumvention governance.", href: "/ops/lead-rules", meta: "Lead" },
        { title: "Commission Rules", description: "Explicit commission policy management for payout traceability.", href: "/ops/commission-rules", meta: "Revenue" },
        { title: "Compliance Rules", description: "Case triggers, freeze policies and SLA governance.", href: "/ops/compliance-rules", meta: "Compliance" },
        { title: "System Settings", description: `${configs.length} platform configuration records are available for governance.`, href: "/ops/settings", meta: "System" },
      ];
    },
    initialData: [],
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Admin Console" title="Enterprise governance modules" description="A dedicated control plane for identity, permissions, security, workflows, auditability and policy management." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => <AdminModuleCard key={module.href} {...module} />)}
      </div>
    </div>
  );
}