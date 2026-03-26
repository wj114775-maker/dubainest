import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";

const rows = [
  { id: "1", name: "Permit publishing gate", code: "publishing_gate", status: "active" },
  { id: "2", name: "Critical freeze policy", code: "freeze_control", status: "active" },
  { id: "3", name: "High severity SLA", code: "sla_policy", status: "active" }
];

export default function OpsComplianceRules() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Compliance rules" description="Define case triggers, freeze controls and SLA policy from a dedicated compliance rulebook." />
      <RegistryTableCard title="Compliance rulebook" columns={[{ key: "name", label: "Rule" }, { key: "code", label: "Type" }, { key: "status", label: "Status" }]} rows={rows} />
    </div>
  );
}