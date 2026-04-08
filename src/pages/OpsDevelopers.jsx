import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import DeveloperPublicPublishingTab from "@/components/ops/DeveloperPublicPublishingTab";
import DeveloperProspectsTab from "@/components/ops/DeveloperProspectsTab";
import DeveloperRegistryTab from "@/components/ops/DeveloperRegistryTab";
import DeveloperAgreementsTab from "@/components/ops/DeveloperAgreementsTab";
import DeveloperInventoryTab from "@/components/ops/DeveloperInventoryTab";
import DeveloperDealsTab from "@/components/ops/DeveloperDealsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { buildDeveloperInventoryTree, convertProspectToOrganisation, createDeveloperActivity, listDeveloperOpsWorkspace } from "@/lib/developerLifecycle";
import { createEntitySafe, getMissingEntitySchemas, updateEntitySafe } from "@/lib/base44Safeguards";

const initialProspectForm = {
  company_name: "",
  main_contact_name: "",
  email: "",
  phone: "",
  source: "",
  owner_user_id: "",
  stage: "uncontacted",
  interest: "medium",
  next_follow_up_at: "",
  notes: "",
};

const emptyWorkspace = {
  organisations: [],
  prospects: [],
  activities: [],
  agreements: [],
  deals: [],
  listingRevisions: [],
  projectRevisions: [],
  memberships: [],
  projects: [],
  listings: [],
  documents: [],
  disputes: [],
  entitlements: [],
  developerProfiles: [],
  projectProfiles: [],
  auditLog: [],
};

export default function OpsDevelopers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: current } = useCurrentUserRole();
  const [form, setForm] = useState(initialProspectForm);

  const { data: workspace = emptyWorkspace } = useQuery({
    queryKey: ["ops-developer-workspace"],
    queryFn: () => listDeveloperOpsWorkspace(),
    initialData: emptyWorkspace,
  });

  const inventory = useMemo(() => buildDeveloperInventoryTree(workspace.organisations, workspace.projects, workspace.listings), [workspace.organisations, workspace.projects, workspace.listings]);
  const missingSchemas = getMissingEntitySchemas(["DeveloperOrganisation", "DeveloperProspect", "DeveloperActivity", "DeveloperAgreement", "DeveloperDeal", "DeveloperListingRevision", "DeveloperProjectRevision"]);
  const summary = [
    { label: "Prospects", value: String(workspace.prospects.filter((item) => item.stage !== "archived").length) },
    { label: "Signed developers", value: String(workspace.organisations.filter((item) => item.status !== "archived").length) },
    { label: "Live deals", value: String(workspace.deals.filter((item) => !["closed", "cancelled"].includes(item.stage)).length) },
    { label: "Pending reviews", value: String(workspace.listingRevisions.filter((item) => ["submitted", "under_review"].includes(item.review_status)).length + workspace.projectRevisions.filter((item) => ["submitted", "under_review"].includes(item.review_status)).length) },
  ];

  const ensureWrite = (result, fallbackMessage) => {
    if (!result?.ok) {
      throw result?.error || new Error(fallbackMessage);
    }
    return result.data;
  };

  const saveProspect = useMutation({
    mutationFn: async () => {
      const result = await createEntitySafe("DeveloperProspect", { ...form, owner_user_id: form.owner_user_id || current?.user?.id, next_follow_up_at: form.next_follow_up_at || undefined });
      if (!result.ok) throw result.error || new Error("Prospect save failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      setForm(initialProspectForm);
      toast({ title: "Prospect saved" });
    },
    onError: () => toast({ title: "Prospect save failed", variant: "destructive" }),
  });

  const prospectAction = useMutation({
    mutationFn: async ({ prospect, action, value }) => {
      const now = new Date().toISOString();
      if (action === "stage") return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { stage: value }), "Stage update failed");
      if (action === "own") return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { owner_user_id: current?.user?.id }), "Owner update failed");
      if (["call", "email", "meeting"].includes(action)) {
        ensureWrite(await createDeveloperActivity({ developer_prospect_id: prospect.id, activity_type: action, direction: "outbound", actor_user_id: current?.user?.id, occurred_at: now, summary: `${prospect.company_name} ${action}` }), "Prospect activity log failed");
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { last_contact_at: now }), "Prospect activity update failed");
      }
      if (action === "send_agreement") {
        ensureWrite(await createEntitySafe("DeveloperAgreement", { developer_prospect_id: prospect.id, agreement_type: "developer_partnership", agreement_status: "sent", signature_status: "pending", sent_at: now }), "Agreement creation failed");
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { stage: "agreement_sent", agreement_status: "sent", signature_status: "pending", last_contact_at: now }), "Prospect agreement state update failed");
      }
      if (action === "send_reminder") {
        ensureWrite(await createDeveloperActivity({ developer_prospect_id: prospect.id, activity_type: "reminder", direction: "system", actor_user_id: current?.user?.id, occurred_at: now, summary: `Reminder sent to ${prospect.company_name}` }), "Reminder log failed");
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { stage: "awaiting_signature", agreement_status: "awaiting_signature", signature_status: "pending", last_contact_at: now }), "Prospect reminder update failed");
      }
      if (action === "not_interested") {
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { stage: "not_interested" }), "Prospect status update failed");
      }
      if (action === "archive") {
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { stage: "archived", archived_at: now }), "Prospect archive failed");
      }
      if (action === "convert") return ensureWrite(await convertProspectToOrganisation({ prospect, currentUserId: current?.user?.id }), "Prospect conversion failed");
      throw new Error("Unsupported action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({ title: "Developer workflow updated" });
    },
    onError: () => toast({ title: "Developer workflow update failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title="Developers"
        description="Run developer prospecting, agreements, conversion, inventory ownership, and deal progression here. Public developer pages stay in a separate publishing tab."
      />

      <AccessGuard permission="settings.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>

      {missingSchemas.length ? (
        <Card className="rounded-[2rem] border-amber-300/60 bg-amber-50">
          <CardContent className="space-y-2 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-700">Publish required</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Developer lifecycle records need live Base44 schemas</h2>
            <p className="text-sm leading-6 text-slate-700">Missing live schemas: {missingSchemas.join(", ")}.</p>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="prospects" className="space-y-6">
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="registry">Signed developers</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="publishing">Public publishing</TabsTrigger>
        </TabsList>
        <TabsContent value="prospects"><DeveloperProspectsTab prospects={workspace.prospects} form={form} setForm={setForm} onSubmit={() => saveProspect.mutate()} onAction={(prospect, action, value) => prospectAction.mutate({ prospect, action, value })} loading={saveProspect.isPending || prospectAction.isPending} currentUserId={current?.user?.id || ""} /></TabsContent>
        <TabsContent value="registry"><DeveloperRegistryTab organisations={workspace.organisations} projects={workspace.projects} listings={workspace.listings} deals={workspace.deals} /></TabsContent>
        <TabsContent value="agreements"><DeveloperAgreementsTab agreements={workspace.agreements} organisations={workspace.organisations} prospects={workspace.prospects} /></TabsContent>
        <TabsContent value="inventory"><DeveloperInventoryTab inventory={inventory} /></TabsContent>
        <TabsContent value="deals"><DeveloperDealsTab deals={workspace.deals} organisations={workspace.organisations} projects={workspace.projects} listings={workspace.listings} /></TabsContent>
        <TabsContent value="publishing"><DeveloperPublicPublishingTab /></TabsContent>
      </Tabs>
    </div>
  );
}
