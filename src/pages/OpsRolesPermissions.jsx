import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RuleTable from "@/components/admin/RuleTable";

const items = [
  { id: "1", name: "Internal Admin Core", description: "Global administration, security controls, audit and settings authority.", type: "bundle", status: "active" },
  { id: "2", name: "Partner Governance", description: "Partner access, lead rules and commission rule authority.", type: "bundle", status: "active" },
  { id: "3", name: "Compliance Reviewer", description: "Case decisions, freeze controls and SLA handling.", type: "role", status: "active" }
];

export default function OpsRolesPermissions() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Roles and permissions" description="Introduce granular permission bundles and scoped role assignments without breaking legacy role compatibility." />
      <RuleTable title="Role and permission registry" items={items} />
    </div>
  );
}