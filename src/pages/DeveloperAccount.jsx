import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import useDeveloperPortalWorkspace from "@/hooks/useDeveloperPortalWorkspace";
import { compactLabel } from "@/lib/revenue";

const scopeOptions = [
  { key: "projects", label: "Edit projects" },
  { key: "listings", label: "Edit listings" },
  { key: "deals", label: "View deals" },
  { key: "documents", label: "Upload documents" },
  { key: "account", label: "Manage account" },
];

function parseScope(value = "") {
  return String(value || "")
    .split(/[,\n|]/g)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function buildScopeString(scopeState) {
  return scopeOptions.filter((option) => scopeState[option.key]).map((option) => option.key).join(",");
}

function createScopeState(value = "") {
  const tokens = new Set(parseScope(value));
  return scopeOptions.reduce((acc, option) => {
    acc[option.key] = tokens.has(option.key) || tokens.has(`${option.key}.manage`) || tokens.has(`${option.key}.view`);
    return acc;
  }, {});
}

function buildFormFromMembership(membership = null) {
  return {
    membership_type: membership?.membership_type || "developer_staff",
    status: membership?.status || "active",
    scope: createScopeState(membership?.assignment_scope || "projects,listings,deals,documents"),
  };
}

export default function DeveloperAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: workspace, current } = useDeveloperPortalWorkspace();
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [inviteForm, setInviteForm] = useState(buildFormFromMembership());
  const [editForm, setEditForm] = useState(buildFormFromMembership());

  const selectedMembership = useMemo(
    () => workspace.organisationMemberships.find((item) => item.id === selectedMembershipId) || null,
    [selectedMembershipId, workspace.organisationMemberships]
  );

  const resetAccessForm = () => {
    setSelectedMembershipId("");
    setEditForm(buildFormFromMembership());
  };

  const inviteStaff = useMutation({
    mutationFn: async () => {
      const inviteResponse = await base44.functions.invoke("adminManageUserAccess", {
        action: "invite_user",
        email: inviteEmail.trim(),
        inviteRole: inviteForm.membership_type === "developer_admin" ? "developer_admin" : "developer_staff",
        organisationType: "developer_organisation",
        organisationId: workspace.organisation.id,
      });
      const invitedUserId = inviteResponse?.invited?.id || inviteResponse?.invited?.user_id || inviteResponse?.invited?.user?.id;
      if (!invitedUserId) {
        throw new Error("Invite was sent but no user id was returned for membership creation.");
      }
      await base44.functions.invoke("adminManageUserAccess", {
        action: "create_membership",
        membershipPayload: {
          user_id: invitedUserId,
          organisation_type: "developer_organisation",
          organisation_id: workspace.organisation.id,
          membership_type: inviteForm.membership_type,
          status: inviteForm.status,
          assignment_scope: buildScopeString(inviteForm.scope),
          notes: `Developer portal invite for ${workspace.organisation.trading_name || workspace.organisation.legal_name}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      setInviteEmail("");
      setInviteForm(buildFormFromMembership());
      toast({ title: "Staff invite sent" });
    },
    onError: (error) => {
      toast({
        title: "Staff invite failed",
        description: String(error?.message || "The invite could not be completed."),
        variant: "destructive",
      });
    },
  });

  const saveAccess = useMutation({
    mutationFn: async () => {
      if (!selectedMembership) throw new Error("Select a membership first.");
      await base44.functions.invoke("adminManageUserAccess", {
        action: "update_membership",
        membershipId: selectedMembership.id,
        membershipPayload: {
          user_id: selectedMembership.user_id,
          organisation_type: "developer_organisation",
          organisation_id: workspace.organisation.id,
          membership_type: editForm.membership_type,
          status: editForm.status,
          assignment_scope: buildScopeString(editForm.scope),
          notes: `Updated from developer portal by ${current?.user?.id || "developer admin"}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      resetAccessForm();
      toast({ title: "Membership updated" });
    },
    onError: (error) => {
      toast({
        title: "Membership update failed",
        description: String(error?.message || "The membership could not be updated."),
        variant: "destructive",
      });
    },
  });

  const toggleMembershipStatus = useMutation({
    mutationFn: async ({ membership, status }) => {
      await base44.functions.invoke("adminManageUserAccess", {
        action: "update_membership",
        membershipId: membership.id,
        membershipPayload: {
          user_id: membership.user_id,
          organisation_type: "developer_organisation",
          organisation_id: workspace.organisation.id,
          membership_type: membership.membership_type,
          status,
          assignment_scope: membership.assignment_scope || "",
          notes: `Membership ${status} from developer portal by ${current?.user?.id || "developer admin"}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      toast({ title: "Membership status updated" });
    },
    onError: () => {
      toast({ title: "Membership status update failed", variant: "destructive" });
    },
  });

  if (!workspace.organisation) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Developer portal" title="Account" description="Account access is available after a developer organisation has been linked to your account." />
        <EmptyStateCard title="No developer organisation linked" description="Ask the internal team to complete your portal setup first." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Developer portal"
        title="Account and access"
        description="Developer admins can invite staff, control access scope, and deactivate memberships from the portal."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(320px,1.1fr)]">
        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardHeader><CardTitle>Organisation profile</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Legal name: <span className="text-foreground">{workspace.organisation.legal_name}</span></p>
            <p>Trading name: <span className="text-foreground">{workspace.organisation.trading_name || "—"}</span></p>
            <p>Status: <span className="text-foreground">{compactLabel(workspace.organisation.status)}</span></p>
            <p>Portal enabled: <span className="text-foreground">{workspace.organisation.portal_enabled ? "Yes" : "No"}</span></p>
            <p>Primary contact: <span className="text-foreground">{workspace.organisation.primary_contact_name || "Not set"}</span></p>
            <p>Primary email: <span className="text-foreground">{workspace.organisation.primary_contact_email || "Not set"}</span></p>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardHeader><CardTitle>Your workspace capabilities</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant={workspace.capabilities.canEditProjects ? "default" : "outline"}>Projects</Badge>
            <Badge variant={workspace.capabilities.canEditListings ? "default" : "outline"}>Listings</Badge>
            <Badge variant={workspace.capabilities.canViewDeals ? "default" : "outline"}>Deals</Badge>
            <Badge variant={workspace.capabilities.canUploadDocuments ? "default" : "outline"}>Documents</Badge>
            <Badge variant={workspace.capabilities.canManageAccount ? "default" : "outline"}>Account</Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Organisation staff access</CardTitle></CardHeader>
        <CardContent>
          {workspace.organisationMemberships.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Membership</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.organisationMemberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell>{membership.user_id}</TableCell>
                    <TableCell>{compactLabel(membership.membership_type || "member")}</TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(membership.status || "active")}</Badge></TableCell>
                    <TableCell>{membership.assignment_scope || "Full workspace"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMembershipId(membership.id);
                            setEditForm(buildFormFromMembership(membership));
                          }}
                          disabled={!workspace.capabilities.canManageAccount}
                        >
                          Edit access
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleMembershipStatus.mutate({ membership, status: membership.status === "inactive" ? "active" : "inactive" })}
                          disabled={toggleMembershipStatus.isPending || !workspace.capabilities.canManageAccount}
                        >
                          {membership.status === "inactive" ? "Reactivate" : "Deactivate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyStateCard title="No staff memberships" description="Invite the first staff member or ask ops to seed the initial access." />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)]">
        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardHeader><CardTitle>Invite staff</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="developer-invite-email">Email</Label>
              <Input id="developer-invite-email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="staff@developer.com" />
            </div>
            <div className="space-y-2">
              <Label>Membership type</Label>
              <Select value={inviteForm.membership_type} onValueChange={(value) => setInviteForm((currentForm) => ({ ...currentForm, membership_type: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="developer_staff">Developer staff</SelectItem>
                  <SelectItem value="developer_admin">Developer admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={inviteForm.status} onValueChange={(value) => setInviteForm((currentForm) => ({ ...currentForm, status: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Access scope</Label>
              {scopeOptions.map((option) => (
                <div key={option.key} className="flex items-center gap-3">
                  <Checkbox
                    id={`invite-scope-${option.key}`}
                    checked={Boolean(inviteForm.scope[option.key])}
                    onCheckedChange={(value) => setInviteForm((currentForm) => ({ ...currentForm, scope: { ...currentForm.scope, [option.key]: Boolean(value) } }))}
                  />
                  <Label htmlFor={`invite-scope-${option.key}`}>{option.label}</Label>
                </div>
              ))}
            </div>
            <Button onClick={() => inviteStaff.mutate()} disabled={inviteStaff.isPending || !workspace.capabilities.canManageAccount || !inviteEmail.trim()}>
              Invite and grant access
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardHeader><CardTitle>{selectedMembership ? `Edit access for ${selectedMembership.user_id}` : "Edit member access"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {selectedMembership ? (
              <>
                <div className="space-y-2">
                  <Label>Membership type</Label>
                  <Select value={editForm.membership_type} onValueChange={(value) => setEditForm((currentForm) => ({ ...currentForm, membership_type: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="developer_staff">Developer staff</SelectItem>
                      <SelectItem value="developer_admin">Developer admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm((currentForm) => ({ ...currentForm, status: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="invited">Invited</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Access scope</Label>
                  {scopeOptions.map((option) => (
                    <div key={option.key} className="flex items-center gap-3">
                      <Checkbox
                        id={`member-scope-${option.key}`}
                        checked={Boolean(editForm.scope[option.key])}
                        onCheckedChange={(value) => setEditForm((currentForm) => ({ ...currentForm, scope: { ...currentForm.scope, [option.key]: Boolean(value) } }))}
                      />
                      <Label htmlFor={`member-scope-${option.key}`}>{option.label}</Label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => saveAccess.mutate()} disabled={saveAccess.isPending || !workspace.capabilities.canManageAccount}>Save access</Button>
                  <Button variant="outline" onClick={resetAccessForm}>Clear</Button>
                </div>
              </>
            ) : (
              <EmptyStateCard title="No member selected" description="Choose a staff member from the table to edit membership type, status, or access scope." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
