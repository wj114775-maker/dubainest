import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { defaultAppConfig } from "@/lib/appShell";

export default function useAppConfig() {
  return useQuery({
    queryKey: ["app-config"],
    queryFn: async () => {
      const records = await base44.entities.AppConfig.list();
      return records[0] || defaultAppConfig;
    },
    initialData: defaultAppConfig,
  });
}