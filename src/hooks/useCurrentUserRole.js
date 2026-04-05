import { useQuery } from "@tanstack/react-query";
import { getCurrentAccessState } from "@/lib/accessRuntime";

export default function useCurrentUserRole() {
  return useQuery({
    queryKey: ["me-role"],
    queryFn: () => getCurrentAccessState(),
  });
}
