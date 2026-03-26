import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";

const rows = [
  { id: "1", name: "High-intent ownership lock", code: "ownership_lock", status: "active" },
  { id: "2", name: "Anti-circumvention hold", code: "anti_circumvention", status: "active" },
  { id: "3", name: "Payout trigger policy", code: "payout_trigger", status: "draft" }
];

export default function OpsLeadRules() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Lead protection rules" description="Move ownership, attribution and payout logic into a central event-driven governance layer." />
      <RegistryTableCard title="Lead protection engine" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Type" }, { key: "status", label: "Status" }]} rows={rows} />
    </div>
  );
}