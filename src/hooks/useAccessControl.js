import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getPermissionSet, hasPermission } from "@/lib/permissions";
import { roleGroups } from "@/lib/appShell";

export default function useAccessControl() {
  return useQuery({
    queryKey: ["access-control"],
    queryFn: async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) {
        return { isAuthenticated: false, user: null, role: "buyer", permissions: [], can: () => false };
      }

      const user = await base44.auth.me();
      const assignments = await base44.entities.UserRoleAssignment.filter({ user_id: user.id, status: "active" });
      const activeAssignments = assignments.filter((assignment) => !assignment.end_date || new Date(assignment.end_date) >= new Date());
      const role = user?.role || "buyer";
      const permissions = getPermissionSet(activeAssignments.map((assignment) => ({
        permission_codes: assignment.permission_codes || [],
        bundle_codes: assignment.bundle_codes || []
      })), role);
      const isInternal = roleGroups.internal.includes(role);

      return {
        isAuthenticated: true,
        user,
        role,
        assignments: activeAssignments,
        permissions,
        can: (permission) => isInternal || hasPermission(permissions, permission)
      };
    },
    initialData: { isAuthenticated: false, user: null, role: "buyer", assignments: [], permissions: [], can: () => false }
  });
}