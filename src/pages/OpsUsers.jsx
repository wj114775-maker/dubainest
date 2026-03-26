import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import UsersRegistryCard from "@/components/admin/UsersRegistryCard";

export default function OpsUsers() {
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

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Users and access control" description="Manage identity status, legacy roles, role assignments, security state and future permission bundles from one registry." />
      <UsersRegistryCard users={registry} />
    </div>
  );
}