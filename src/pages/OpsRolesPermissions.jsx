import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";

export default function OpsRolesPermissions() {
  const { data } = useQuery({
    queryKey: ["ops-rbac-registry"],
    queryFn: async () => {
      const [roles, permissions, bundles] = await Promise.all([
        base44.entities.Role.list(),
        base44.entities.Permission.list(),
        base44.entities.PermissionBundle.list()
      ]);

      return {
        roles: roles.map((item) => ({ id: item.id, name: item.name, code: item.code, status: item.status || "active" })),
        permissions: permissions.map((item) => ({ id: item.id, name: item.name, code: item.code, status: item.status || "active" })),
        bundles: bundles.map((item) => ({ id: item.id, name: item.name, code: item.code, status: item.status || "active" }))
      };
    },
    initialData: { roles: [], permissions: [], bundles: [] }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Roles and permissions" description="Introduce granular permission bundles and scoped role assignments without breaking legacy role compatibility." />
      <AccessGuard permission="roles.read">
        <div className="grid gap-6 xl:grid-cols-3">
          <RegistryTableCard title="Roles" columns={[{ key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "status", label: "Status" }]} rows={data.roles} />
          <RegistryTableCard title="Permissions" columns={[{ key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "status", label: "Status" }]} rows={data.permissions} />
          <RegistryTableCard title="Bundles" columns={[{ key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "status", label: "Status" }]} rows={data.bundles} />
        </div>
      </AccessGuard>
    </div>
  );
}