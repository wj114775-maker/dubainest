import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";

export default function OpsSecurity() {
  const { data } = useQuery({
    queryKey: ["ops-security-overview"],
    queryFn: async () => {
      const [securityStates, auditLogs] = await Promise.all([
        base44.entities.UserSecurityState.list(),
        base44.entities.AuditLog.list()
      ]);

      const actionCounts = {
        suspend: auditLogs.filter((item) => item.action === "suspend").length,
        password_reset: auditLogs.filter((item) => item.action === "password_reset").length,
        mfa_reset: auditLogs.filter((item) => item.action === "mfa_reset").length,
        unlock: auditLogs.filter((item) => item.action === "unlock").length
      };

      return { securityStates, actionCounts };
    },
    initialData: { securityStates: [], actionCounts: { suspend: 0, password_reset: 0, mfa_reset: 0, unlock: 0 } }
  });

  const rows = [
    { id: "suspend", name: "Suspension control", code: "users.security_actions", status: `${data.actionCounts.suspend} actions logged` },
    { id: "mfa", name: "MFA reset control", code: "security.mfa_reset", status: `${data.actionCounts.mfa_reset} actions logged` },
    { id: "password", name: "Password reset enforcement", code: "security.password_reset", status: `${data.actionCounts.password_reset} actions logged` },
    { id: "unlock", name: "Unlock control", code: "security.unlock", status: `${data.actionCounts.unlock} actions logged` }
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Security" title="Security controls" description="Prepare account-level security actions with auditability and controlled admin permissions." />
      <AccessGuard permission="users.read">
        <RegistryTableCard title={`Security administration controls · ${data.securityStates.length} tracked user states`} columns={[{ key: "name", label: "Control" }, { key: "code", label: "Permission" }, { key: "status", label: "Status" }]} rows={rows} />
      </AccessGuard>
    </div>
  );
}