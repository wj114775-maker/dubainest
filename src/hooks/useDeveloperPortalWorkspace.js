import { useQuery } from "@tanstack/react-query";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { listDeveloperPortalWorkspace } from "@/lib/developerLifecycle";

const emptyWorkspace = {
  memberships: [],
  organisationMemberships: [],
  membership: null,
  capabilities: {
    canEditProjects: false,
    canEditListings: false,
    canViewDeals: false,
    canUploadDocuments: false,
    canManageAccount: false,
  },
  organisation: null,
  projects: [],
  listings: [],
  deals: [],
  listingRevisions: [],
  projectRevisions: [],
  documents: [],
  disputes: [],
  entitlements: [],
  notifications: [],
};

export default function useDeveloperPortalWorkspace() {
  const { data: current } = useCurrentUserRole();

  const query = useQuery({
    queryKey: ["developer-portal-workspace", current?.user?.id],
    enabled: Boolean(current?.user?.id),
    queryFn: () => listDeveloperPortalWorkspace(current.user.id),
    initialData: emptyWorkspace,
  });

  return {
    ...query,
    current,
  };
}
