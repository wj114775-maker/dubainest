import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function useCurrentUserRole() {
  return useQuery({
    queryKey: ["me-role"],
    queryFn: async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return { isAuthenticated: false, role: "buyer", user: null };
      const user = await base44.auth.me();
      return { isAuthenticated: true, role: user?.role || "buyer", user };
    },
    initialData: { isAuthenticated: false, role: "buyer", user: null },
  });
}