import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import RegistryTableCard from "@/components/admin/RegistryTableCard";
import AccessGuard from "@/components/admin/AccessGuard";
import SecurityStatesTableCard from "@/components/admin/SecurityStatesTableCard";
import AdminMetricGrid from "@/components/admin/AdminMetricGrid";
import SecurityActionPanel from "@/components/admin/SecurityActionPanel";

export default function OpsSecurity() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState(null);
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

  const securityAction = useMutation({
    mutationFn: ({ action, reason }) => base44.functions.invoke("adminUserLifecycleAction", { targetUserId: selectedUser.user_id, action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-security-overview"] });
    }
  });

  const selectedState = useMemo(() => {
    if (!selectedUser) return null;
    return data.userStates.find((item) => item.user_id === selectedUser.user_id) || selectedUser;
  }, [data.userStates, selectedUser]);

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
        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <SecurityStatesTableCard rows={data.userStates} onSelect={setSelectedUser} selectedUserId={selectedState?.user_id} />
          <AccessGuard permission="users.manage">
            <SecurityActionPanel selectedUser={selectedState} onAction={(action, reason) => securityAction.mutate({ action, reason })} />
          </AccessGuard>
        </div>
      </AccessGuard>
    </div>
  );
}