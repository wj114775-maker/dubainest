import { useQuery } from "@tanstack/react-query";
import { getFallbackApprovedDevelopers, loadApprovedDevelopers } from "@/lib/approvedDevelopers";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function useApprovedDevelopers() {
  return useQuery({
    queryKey: ["approved-developers"],
    queryFn: () => loadApprovedDevelopers(),
    staleTime: DAY_MS,
    gcTime: DAY_MS,
    placeholderData: getFallbackApprovedDevelopers(),
  });
}
