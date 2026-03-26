import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RuleTable from "@/components/admin/RuleTable";

const items = [
  { id: "1", name: "High-intent ownership lock", description: "Lock ownership when shortlist share or concierge events are triggered.", type: "ownership_lock", status: "active" },
  { id: "2", name: "Anti-circumvention hold", description: "Freeze reassignment when protected lead events indicate bypass risk.", type: "anti_circumvention", status: "active" },
  { id: "3", name: "Payout trigger policy", description: "Emit immutable payout events only from approved lead lifecycle transitions.", type: "payout_trigger", status: "draft" }
];

export default function OpsLeadRules() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Lead protection rules" description="Move ownership, attribution and payout logic into a central event-driven governance layer." />
      <RuleTable title="Lead protection engine" items={items} />
    </div>
  );
}