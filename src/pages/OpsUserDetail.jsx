import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserProfileHeader from "@/components/admin/UserProfileHeader";
import UserOverviewCard from "@/components/admin/UserOverviewCard";
import UserAuditTimeline from "@/components/admin/UserAuditTimeline";

export default function OpsUserDetail() {
  const { id } = useParams();

  const { data } = useQuery({
    queryKey: ["ops-user-detail", id],
    queryFn: async () => {
      const [users, assignments, securityStates, memberships, notes, flags, audits] = await Promise.all([
        base44.entities.User.list(),
        base44.entities.UserRoleAssignment.filter({ user_id: id }),
        base44.entities.UserSecurityState.filter({ user_id: id }),
        base44.entities.OrganisationMembership.filter({ user_id: id }),
        base44.entities.AccountNote.filter({ user_id: id }),
        base44.entities.AccountFlag.filter({ user_id: id }),
        base44.entities.AuditLog.filter({ target_user_id: id })
      ]);

      const user = users.find((item) => item.id === id) || null;
      return {
        user,
        assignments,
        securityState: securityStates[0] || null,
        memberships,
        notes,
        flags,
        audits
      };
    },
    initialData: {
      user: null,
      assignments: [],
      securityState: null,
      memberships: [],
      notes: [],
      flags: [],
      audits: []
    }
  });

  const accessItems = [
    { label: "Legacy role", value: data.user?.role || "buyer" },
    { label: "Active assignments", value: String(data.assignments.filter((item) => item.status === "active").length) },
    { label: "Scoped bundles", value: data.assignments.flatMap((item) => item.bundle_codes || []).join(", ") || "None" },
    { label: "Direct permissions", value: data.assignments.flatMap((item) => item.permission_codes || []).join(", ") || "None" }
  ];

  const securityItems = [
    { label: "Security status", value: data.securityState?.security_status || "normal" },
    { label: "Suspended", value: data.securityState?.is_suspended ? "Yes" : "No" },
    { label: "Locked", value: data.securityState?.is_locked ? "Yes" : "No" },
    { label: "Last action", value: data.securityState?.last_security_action_at ? new Date(data.securityState.last_security_action_at).toLocaleString() : "—", hint: data.securityState?.last_security_action_by || undefined }
  ];

  const membershipItems = data.memberships.map((item) => ({
    label: item.organisation_id || item.organisation_type,
    value: item.membership_type,
    hint: item.status || "invited"
  }));

  const noteItems = data.notes.map((item) => ({
    label: item.category || "general",
    value: item.note,
    hint: item.visibility || "internal"
  }));

  const flagItems = data.flags.map((item) => ({
    label: item.flag_type,
    value: item.severity,
    hint: item.status || "active"
  }));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Administration"
        title="User profile"
        description="Review access, security state, memberships, notes, flags and audit history for an individual user."
        action={<Button variant="outline" asChild><Link to="/ops/users">Back to users</Link></Button>}
      />

      <UserProfileHeader
        user={data.user}
        securityState={data.securityState}
        assignmentCount={data.assignments.length}
        membershipCount={data.memberships.length}
        noteCount={data.notes.length}
        flagCount={data.flags.length}
      />

      <Tabs defaultValue="access" className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/70 p-2">
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="memberships">Memberships</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="flags">Flags</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <UserOverviewCard title="Access assignments" items={accessItems} />
        </TabsContent>

        <TabsContent value="security">
          <UserOverviewCard title="Security state" items={securityItems} />
        </TabsContent>

        <TabsContent value="memberships">
          <UserOverviewCard title="Organisation memberships" items={membershipItems.length ? membershipItems : [{ label: "Memberships", value: "None assigned" }]} />
        </TabsContent>

        <TabsContent value="notes">
          <UserOverviewCard title="Internal notes" items={noteItems.length ? noteItems : [{ label: "Notes", value: "No internal notes" }]} />
        </TabsContent>

        <TabsContent value="flags">
          <UserOverviewCard title="Account flags" items={flagItems.length ? flagItems : [{ label: "Flags", value: "No active flags" }]} />
        </TabsContent>

        <TabsContent value="audit">
          <UserAuditTimeline items={data.audits} />
        </TabsContent>
      </Tabs>
    </div>
  );
}