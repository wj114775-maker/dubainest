import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminMembershipCard from "@/components/admin/AdminMembershipCard";
import PartnerMembershipTableCard from "@/components/admin/PartnerMembershipTableCard";

export default function OpsPartnerAccess() {
  const queryClient = useQueryClient();
  const [editingMembership, setEditingMembership] = useState(null);
  const { data: rows = [] } = useQuery({
    queryKey: ["ops-partner-access"],
    queryFn: async () => {
      const memberships = await base44.entities.OrganisationMembership.filter({ organisation_type: "partner_agency" });
      return memberships.map((item) => ({
        id: item.id,
        name: item.organisation_id,
        code: item.membership_type,
        status: item.status || "invited",
        source: item
      }));
    },
    initialData: []
  });

  const manageMembership = useMutation({
    mutationFn: ({ action, membershipId, membershipPayload }) => base44.functions.invoke("adminManageUserAccess", { action, membershipId, membershipPayload }),
    onSuccess: () => {
      setEditingMembership(null);
      queryClient.invalidateQueries({ queryKey: ["ops-partner-access"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Partner access" description="Govern partner memberships, organisation access, verification state and scoped execution rights." />
      <AccessGuard permission="partners.read">
        <PartnerMembershipTableCard rows={rows} onEdit={setEditingMembership} />
      </AccessGuard>
      <AccessGuard permission="partners.manage">
        <AdminMembershipCard onCreate={(form) => manageMembership.mutate({ action: editingMembership ? "update_membership" : "create_membership", membershipId: editingMembership?.id, membershipPayload: form })} membership={editingMembership} onCancel={() => setEditingMembership(null)} />
      </AccessGuard>
    </div>
  );
}