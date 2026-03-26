import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RuleTable from "@/components/admin/RuleTable";

const items = [
  { id: "1", name: "Permit publishing gate", description: "Prevent publication when permit verification is expired or unresolved.", type: "publishing_gate", status: "active" },
  { id: "2", name: "Critical freeze policy", description: "Freeze listings, payouts or partner access when critical findings are raised.", type: "freeze_control", status: "active" },
  { id: "3", name: "High severity SLA", description: "Escalate critical cases if reviewer action is overdue.", type: "sla_policy", status: "active" }
];

export default function OpsComplianceRules() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Compliance rules" description="Define case triggers, freeze controls and SLA policy from a dedicated compliance rulebook." />
      <RuleTable title="Compliance rulebook" items={items} />
    </div>
  );
}