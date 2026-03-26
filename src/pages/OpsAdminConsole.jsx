import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import AdminModuleCard from "@/components/admin/AdminModuleCard";

const modules = [
  { title: "Users", description: "Identity registry, status control, legacy roles and assignment visibility.", href: "/ops/users", meta: "Identity" },
  { title: "Roles & Permissions", description: "Permission bundles, scoped role assignments and migration-safe governance.", href: "/ops/roles-permissions", meta: "RBAC" },
  { title: "Partner Access", description: "Partner-side memberships, access scope and verification state.", href: "/ops/partner-access", meta: "Partner" },
  { title: "Security", description: "Force logout, MFA reset and password reset enforcement controls.", href: "/ops/security", meta: "Security" },
  { title: "Lead Rules", description: "Event-driven ownership, attribution and anti-circumvention governance.", href: "/ops/lead-rules", meta: "Lead" },
  { title: "Commission Rules", description: "Explicit commission policy management for payout traceability.", href: "/ops/commission-rules", meta: "Revenue" },
  { title: "Compliance Rules", description: "Case triggers, freeze policies and SLA governance.", href: "/ops/compliance-rules", meta: "Compliance" },
  { title: "System Settings", description: "Global platform configuration and governed operations settings.", href: "/ops/settings", meta: "System" }
];

export default function OpsAdminConsole() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Admin Console" title="Enterprise governance modules" description="A dedicated control plane for identity, permissions, security, workflows, auditability and policy management." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {modules.map((module) => <AdminModuleCard key={module.href} {...module} />)}
      </div>
    </div>
  );
}