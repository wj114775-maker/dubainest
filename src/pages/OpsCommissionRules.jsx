import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RuleTable from "@/components/admin/RuleTable";

const items = [
  { id: "1", name: "Default referral split", description: "Global commission policy for standard partner-led transactions.", type: "global", status: "active" },
  { id: "2", name: "Private inventory override", description: "Premium commission structure for protected inventory workflows.", type: "listing", status: "active" }
];

export default function OpsCommissionRules() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Governance" title="Commission rules" description="Centralise commission policies so payouts and disputes trace back to explicit governed rules." />
      <RuleTable title="Commission policy registry" items={items} />
    </div>
  );
}