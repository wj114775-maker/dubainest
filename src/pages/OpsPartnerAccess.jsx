import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";

export default function OpsPartnerAccess() {
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

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Partner access" description="Govern partner memberships, organisation access, verification state and scoped execution rights." />
      <RegistryTableCard title="Partner access registry" columns={[{ key: "name", label: "Organisation" }, { key: "code", label: "Membership" }, { key: "status", label: "Status" }]} rows={rows} />
    </div>
  );
}