import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import RbacRegistryTableCard from "@/components/admin/RbacRegistryTableCard";
import RbacFormCard from "@/components/admin/RbacFormCard";

export default function OpsRolesPermissions() {
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const roleInitialValues = useMemo(() => ({ name: "", code: "", description: "", status: "active" }), []);
  const bundleInitialValues = useMemo(() => ({ name: "", code: "", description: "", permission_codes: "", status: "active" }), []);
  const roleFields = useMemo(() => ([{ key: "name", label: "Role name" }, { key: "code", label: "Role code" }, { key: "status", label: "Status" }, { key: "description", label: "Description", multiline: true }]), []);
  const bundleFields = useMemo(() => ([{ key: "name", label: "Bundle name" }, { key: "code", label: "Bundle code" }, { key: "status", label: "Status" }, { key: "permission_codes", label: "Permission codes comma separated" }, { key: "description", label: "Description", multiline: true }]), []);

  const { data } = useQuery({
    queryKey: ["ops-rbac-registry"],
    queryFn: async () => {
      const [roles, permissions, bundles] = await Promise.all([
        base44.entities.Role.list(),
        base44.entities.Permission.list(),
        base44.entities.PermissionBundle.list()
      ]);

      return {
        roles: roles.map((item) => ({ id: item.id, name: item.name, code: item.code, status: item.status || "active", source: item })),
        permissions: permissions.map((item) => ({ id: item.id, name: item.name, code: item.code, status: item.status || "active" })),
        bundles: bundles.map((item) => ({ id: item.id, name: item.name, code: item.code, status: item.status || "active", source: item }))
      };
    },
    initialData: { roles: [], permissions: [], bundles: [] }
  });

  const manageRecord = useMutation({
    mutationFn: ({ recordType, action, recordId, payload }) => base44.functions.invoke("adminManageRoleRecord", { recordType, action, recordId, payload }),
    onSuccess: () => {
      setEditingRole(null);
      setEditingBundle(null);
      queryClient.invalidateQueries({ queryKey: ["ops-rbac-registry"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Roles and permissions" description="Introduce granular permission bundles and scoped role assignments without breaking legacy role compatibility." />
      <AccessGuard permission="roles.read">
        <div className="grid gap-6 xl:grid-cols-3">
          <RbacRegistryTableCard title="Roles" rows={data.roles} onEdit={setEditingRole} />
          <RegistryTableCard title="Permissions" columns={[{ key: "name", label: "Name" }, { key: "code", label: "Code" }, { key: "status", label: "Status" }]} rows={data.permissions} />
          <RbacRegistryTableCard title="Bundles" rows={data.bundles} onEdit={setEditingBundle} />
        </div>
      </AccessGuard>
      <AccessGuard permission="roles.manage">
        <div className="grid gap-6 xl:grid-cols-2">
          <RbacFormCard
            title="Create role"
            initialValues={roleInitialValues}
            record={editingRole}
            fields={roleFields}
            onSubmit={(form) => manageRecord.mutate({ recordType: "role", action: editingRole ? "update" : "create", recordId: editingRole?.id, payload: form })}
            onCancel={() => setEditingRole(null)}
            submitLabel="Create role"
          />
          <RbacFormCard
            title="Create bundle"
            initialValues={bundleInitialValues}
            record={editingBundle}
            fields={bundleFields}
            onSubmit={(form) => manageRecord.mutate({ recordType: "bundle", action: editingBundle ? "update" : "create", recordId: editingBundle?.id, payload: { ...form, permission_codes: form.permission_codes.split(',').map((item) => item.trim()).filter(Boolean) } })}
            onCancel={() => setEditingBundle(null)}
            submitLabel="Create bundle"
          />
        </div>
      </AccessGuard>
    </div>
  );
}