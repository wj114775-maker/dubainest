import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getPermissionSet, hasPermission } from "@/lib/permissions";

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
      const permissions = getPermissionSet(assignments.map((assignment) => ({
        permission_codes: assignment.permission_codes || [],
        bundle_codes: assignment.bundle_codes || []
      })), user?.role || "buyer");

      return {
        isAuthenticated: true,
        user,
        role: user?.role || "buyer",
        permissions,
        can: (permission) => hasPermission(permissions, permission)
      };
    },
    initialData: { isAuthenticated: false, user: null, role: "buyer", permissions: [], can: () => false }
  });
}