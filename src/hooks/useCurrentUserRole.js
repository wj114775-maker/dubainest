import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { getPermissionSet } from "@/lib/permissions";

export default function useCurrentUserRole() {
  return useQuery({
    queryKey: ["me-role"],
    queryFn: async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return { isAuthenticated: false, role: "buyer", user: null, permissions: [] };
      const user = await base44.auth.me();
      const assignments = await base44.entities.UserRoleAssignment.filter({ user_id: user.id, status: "active" });
      const activeAssignments = assignments.filter((assignment) => !assignment.end_date || new Date(assignment.end_date) >= new Date());
      const permissions = getPermissionSet(activeAssignments.map((assignment) => ({
        permission_codes: assignment.permission_codes || [],
        bundle_codes: assignment.bundle_codes || []
      })), user?.role || "buyer");
      return { isAuthenticated: true, role: user?.role || "buyer", user, assignments: activeAssignments, permissions };
    },
    initialData: { isAuthenticated: false, role: "buyer", user: null, assignments: [], permissions: [] },
  });
}