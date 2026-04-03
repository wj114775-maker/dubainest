import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import UsersRegistryCard from "@/components/admin/UsersRegistryCard";
import UserRegistryFilters from "@/components/admin/UserRegistryFilters";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminInviteUserCard from "@/components/admin/AdminInviteUserCard";
import AdminAssignmentCard from "@/components/admin/AdminAssignmentCard";
import AdminUserNoteCard from "@/components/admin/AdminUserNoteCard";

export default function OpsUsers() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: registry = [] } = useQuery({
    queryKey: ["ops-users-registry"],
    queryFn: async () => {
      const [users, assignments, securityStates] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.UserRoleAssignment.list(),
        base44.entities.UserSecurityState.list()
      ]);

      return users.map((user) => {
        const userAssignments = assignments.filter((assignment) => assignment.user_id === user.id && assignment.status === "active");
        const security = securityStates.find((item) => item.user_id === user.id);
        return {
          id: user.id,
          name: user.full_name || user.email,
          email: user.email,
          legacyRole: user.role || "buyer",
          status: security?.security_status || "active",
          assignmentCount: userAssignments.length
        };
      });
    },
    initialData: []
  });

  const filteredRegistry = registry.filter((user) => {
    const matchesSearch = !search || [user.name, user.email].join(" ").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = status === "all" || user.status === status;
    return matchesSearch && matchesStatus;
  });

  const inviteUser = useMutation({
    mutationFn: ({ email, role }) => base44.functions.invoke("adminManageUserAccess", { action: "invite_user", email, inviteRole: role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-users-registry"] })
  });

  const createAssignment = useMutation({
    mutationFn: (form) => base44.functions.invoke("adminManageUserAccess", {
      action: "create_assignment",
      assignmentPayload: {
        user_id: form.user_id,
        role_code: form.role_code,
        bundle_codes: form.bundle_codes.split(',').map((item) => item.trim()).filter(Boolean),
        permission_codes: form.permission_codes.split(',').map((item) => item.trim()).filter(Boolean),
        scope_type: form.scope_type,
        scope_id: form.scope_id || undefined,
        notes: form.notes,
        status: "active"
      }
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-users-registry"] })
  });

  const addNote = useMutation({
    mutationFn: (form) => base44.functions.invoke("adminAddAccountNote", form),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-user-detail"] })
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="System control" title="Team, roles, and access control" description="Use this page to manage staff access, assignments, and security state. It is setup work, not daily pipeline handling." />
      <AccessGuard permission="users.read">
        <div className="space-y-6">
          <UserRegistryFilters search={search} onSearchChange={setSearch} status={status} onStatusChange={setStatus} />
          <UsersRegistryCard users={filteredRegistry} />
        </div>
      </AccessGuard>
      <AccessGuard permission="users.invite">
        <div className="grid gap-6 xl:grid-cols-3">
          <AdminInviteUserCard onInvite={(form) => inviteUser.mutate(form)} />
          <AdminAssignmentCard onCreate={(form) => createAssignment.mutate(form)} />
          <AdminUserNoteCard onAdd={(form) => addNote.mutate(form)} />
        </div>
      </AccessGuard>
    </div>
  );
}
