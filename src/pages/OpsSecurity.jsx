import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import SecurityStatesTableCard from "@/components/admin/SecurityStatesTableCard";
import AdminMetricGrid from "@/components/admin/AdminMetricGrid";

export default function OpsSecurity() {
  const { data } = useQuery({
    queryKey: ["ops-security-overview"],
    queryFn: async () => {
      const [securityStates, auditLogs, users] = await Promise.all([
        base44.entities.UserSecurityState.list(),
        base44.entities.AuditLog.list(),
        base44.entities.User.list()
      ]);

      const actionCounts = {
        suspend: auditLogs.filter((item) => item.action === "suspend").length,
        password_reset: auditLogs.filter((item) => item.action === "password_reset").length,
        mfa_reset: auditLogs.filter((item) => item.action === "mfa_reset").length,
        unlock: auditLogs.filter((item) => item.action === "unlock").length
      };

      const userStates = securityStates.map((state) => {
        const user = users.find((item) => item.id === state.user_id);
        return {
          id: state.id,
          user_id: state.user_id,
          name: user?.full_name || user?.email || state.user_id,
          email: user?.email || "—",
          security_status: state.security_status || "normal",
          is_suspended: !!state.is_suspended,
          is_locked: !!state.is_locked
        };
      });

      return { securityStates, actionCounts, userStates };
    },
    initialData: { securityStates: [], actionCounts: { suspend: 0, password_reset: 0, mfa_reset: 0, unlock: 0 }, userStates: [] }
  });

  const rows = [
    { id: "suspend", name: "Suspension control", code: "users.security_actions", status: `${data.actionCounts.suspend} actions logged` },
    { id: "mfa", name: "MFA reset control", code: "security.mfa_reset", status: `${data.actionCounts.mfa_reset} actions logged` },
    { id: "password", name: "Password reset enforcement", code: "security.password_reset", status: `${data.actionCounts.password_reset} actions logged` },
    { id: "unlock", name: "Unlock control", code: "security.unlock", status: `${data.actionCounts.unlock} actions logged` }
  ];

  const metrics = [
    { label: "Tracked user states", value: String(data.securityStates.length) },
    { label: "Suspensions", value: String(data.actionCounts.suspend) },
    { label: "Password resets", value: String(data.actionCounts.password_reset) },
    { label: "MFA resets", value: String(data.actionCounts.mfa_reset) }
  ];

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Security" title="Security controls" description="Manage live account security state with auditability and direct user-level enforcement workflows." />
      <AccessGuard permission="users.read">
        <AdminMetricGrid metrics={metrics} />
      </AccessGuard>
      <AccessGuard permission="users.read">
        <RegistryTableCard title={`Security administration controls · ${data.securityStates.length} tracked user states`} columns={[{ key: "name", label: "Control" }, { key: "code", label: "Permission" }, { key: "status", label: "Status" }]} rows={rows} />
      </AccessGuard>
      <AccessGuard permission="users.read">
        <SecurityStatesTableCard rows={data.userStates} />
      </AccessGuard>
    </div>
  );
}