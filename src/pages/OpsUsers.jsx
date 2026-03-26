import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import UserAccessTable from "@/components/admin/UserAccessTable";

const users = [
  { id: "1", name: "Layla Mansoor", email: "layla@nestdubai.com", legacyRole: "admin", status: "active", assignmentCount: 5 },
  { id: "2", name: "Omar Saif", email: "omar@partner.ae", legacyRole: "partner_admin", status: "pending_verification", assignmentCount: 2 },
  { id: "3", name: "Maya Noor", email: "maya@nestdubai.com", legacyRole: "compliance", status: "suspended", assignmentCount: 3 }
];

export default function OpsUsers() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Administration" title="Users and access control" description="Manage identity status, legacy roles, role assignments, security state and future permission bundles from one registry." />
      <UserAccessTable users={users} />
    </div>
  );
}