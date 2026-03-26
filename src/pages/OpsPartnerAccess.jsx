import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminMembershipCard from "@/components/admin/AdminMembershipCard";

export default function OpsPartnerAccess() {
  const queryClient = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["ops-partner-access"],
    queryFn: async () => {
      const memberships = await base44.entities.OrganisationMembership.filter({ organisation_type: "partner_agency" });
      return memberships.map((item) => ({
        id: item.id,
        name: item.organisation_id,
        code: item.membership_type,
        status: item.status || "invited"
      }));
    },
    initialData: []
  });

  const createMembership = useMutation({
    mutationFn: (membershipPayload) => base44.functions.invoke("adminManageUserAccess", { action: "create_membership", membershipPayload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-partner-access"] })
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Partner access" description="Govern partner memberships, organisation access, verification state and scoped execution rights." />
      <AccessGuard permission="partners.read">
        <RegistryTableCard title="Partner access registry" columns={[{ key: "name", label: "Organisation" }, { key: "code", label: "Membership" }, { key: "status", label: "Status" }]} rows={rows} />
      </AccessGuard>
      <AccessGuard permission="partners.manage">
        <AdminMembershipCard onCreate={(form) => createMembership.mutate(form)} />
      </AccessGuard>
    </div>
  );
}