import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";

const rows = [
  { id: "1", name: "Force logout control", code: "security.force_logout", status: "available" },
  { id: "2", name: "MFA reset control", code: "security.mfa_reset", status: "available" },
  { id: "3", name: "Password reset enforcement", code: "security.password_reset", status: "available" }
];

export default function OpsSecurity() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Security" title="Security controls" description="Prepare account-level security actions with auditability and controlled admin permissions." />
      <RegistryTableCard title="Security administration controls" columns={[{ key: "name", label: "Control" }, { key: "code", label: "Permission" }, { key: "status", label: "Status" }]} rows={rows} />
    </div>
  );
}