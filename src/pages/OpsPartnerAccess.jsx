import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RuleTable from "@/components/admin/RuleTable";

const items = [
  { id: "1", name: "Prime Estates LLC", description: "Agency owner, broker, finance and coordinator memberships under managed access.", type: "partner_agency", status: "active" },
  { id: "2", name: "Harbour Front Realty", description: "Suspended access pending verification evidence and commercial review.", type: "partner_agency", status: "pending_review" }
];

export default function OpsPartnerAccess() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Partner access" description="Govern partner memberships, organisation access, verification state and scoped execution rights." />
      <RuleTable title="Partner access registry" items={items} />
    </div>
  );
}