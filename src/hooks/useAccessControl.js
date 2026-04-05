import { useQuery } from "@tanstack/react-query";
import { getCurrentAccessState } from "@/lib/accessRuntime";

export default function useAccessControl() {
  return useQuery({
    queryKey: ["access-control"],
    queryFn: () => getCurrentAccessState(),
  });
}
