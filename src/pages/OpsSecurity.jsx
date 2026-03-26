import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RuleTable from "@/components/admin/RuleTable";

const items = [
  { id: "1", name: "Force logout control", description: "Terminate active sessions for a target account or access scope.", type: "security_action", status: "available" },
  { id: "2", name: "MFA reset control", description: "Reset MFA setup and require re-enrolment for a selected user.", type: "security_action", status: "available" },
  { id: "3", name: "Password reset enforcement", description: "Trigger password reset and force credential refresh on next login.", type: "security_action", status: "available" }
];

export default function OpsSecurity() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Security" title="Security controls" description="Prepare account-level security actions with auditability and controlled admin permissions." />
      <RuleTable title="Security administration controls" items={items} />
    </div>
  );
}