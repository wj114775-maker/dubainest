import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";

const rows = [
  { id: "1", name: "Default referral split", code: "global", status: "active" },
  { id: "2", name: "Private inventory override", code: "listing", status: "active" }
];

export default function OpsCommissionRules() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Commission rules" description="Centralise commission policies so payouts and disputes trace back to explicit governed rules." />
      <RegistryTableCard title="Commission policy registry" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Scope" }, { key: "status", label: "Status" }]} rows={rows} />
    </div>
  );
}