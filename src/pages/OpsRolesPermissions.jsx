import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminRecordFormCard from "@/components/admin/AdminRecordFormCard";

export default function OpsRolesPermissions() {
  const queryClient = useQueryClient();
  const [roleForm, setRoleForm] = useState({ name: "", code: "", description: "", status: "active" });
  const [bundleForm, setBundleForm] = useState({ name: "", code: "", description: "", permission_codes: "", status: "active" });

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

  const manageRecord = useMutation({
    mutationFn: ({ recordType, payload }) => base44.functions.invoke("adminManageRoleRecord", { recordType, action: "create", payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-rbac-registry"] })
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
      <AccessGuard permission="roles.manage">
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminRecordFormCard
            title="Create role"
            values={roleForm}
            onChange={(key, value) => setRoleForm((current) => ({ ...current, [key]: value }))}
            fields={[{ key: "name", label: "Role name" }, { key: "code", label: "Role code" }, { key: "status", label: "Status" }, { key: "description", label: "Description", multiline: true }]}
            onSubmit={() => manageRecord.mutate({ recordType: "role", payload: roleForm })}
            submitLabel="Create role"
          />
          <AdminRecordFormCard
            title="Create bundle"
            values={bundleForm}
            onChange={(key, value) => setBundleForm((current) => ({ ...current, [key]: value }))}
            fields={[{ key: "name", label: "Bundle name" }, { key: "code", label: "Bundle code" }, { key: "status", label: "Status" }, { key: "permission_codes", label: "Permission codes comma separated" }, { key: "description", label: "Description", multiline: true }]}
            onSubmit={() => manageRecord.mutate({ recordType: "bundle", payload: { ...bundleForm, permission_codes: bundleForm.permission_codes.split(',').map((item) => item.trim()).filter(Boolean) } })}
            submitLabel="Create bundle"
          />
        </div>
      </AccessGuard>
    </div>
  );
}