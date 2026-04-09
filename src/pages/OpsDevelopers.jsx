import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import DeveloperPublicPublishingTab from "@/components/ops/DeveloperPublicPublishingTab";
import DeveloperProspectsTab from "@/components/ops/DeveloperProspectsTab";
import DeveloperRegistryTab from "@/components/ops/DeveloperRegistryTab";
import DeveloperAgreementsTab from "@/components/ops/DeveloperAgreementsTab";
import DeveloperInventoryTab from "@/components/ops/DeveloperInventoryTab";
import DeveloperDealsTab from "@/components/ops/DeveloperDealsTab";
import OpsDeskNav from "@/components/ops/OpsDeskNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import {
  buildDeveloperInventoryTree,
  createDeveloperActivity,
  createDeveloperOperationalStarterSet,
  DEMO_OPERATIONAL_DEAL_CODE,
  DEMO_OPERATIONAL_DEVELOPER_SLUG,
  convertProspectToOrganisation,
  hasOperationalStarterWorkspace,
  listDeveloperOpsWorkspace,
} from "@/lib/developerLifecycle";
import { createEntitySafe, getBase44ErrorText, getMissingEntitySchemas, updateEntitySafe } from "@/lib/base44Safeguards";

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

const developerLifecycleSchemaNames = [
  "DeveloperOrganisation",
  "DeveloperProspect",
  "DeveloperActivity",
  "DeveloperAgreement",
  "DeveloperDeal",
  "DeveloperListingRevision",
  "DeveloperProjectRevision",
];

function normalizeImportDateTime(value = "") {
  if (!String(value || "").trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function buildDealWorkflowPayload(action, now) {
  if (action === "reservation_received") {
    return { stage: "reservation_pending", reservation_status: "confirmed" };
  }
  if (action === "spa_sent") {
    return { stage: "contract_pending", contract_status: "spa_sent" };
  }
  if (action === "spa_signed") {
    return { stage: "payment_milestones", contract_status: "spa_signed" };
  }
  if (action === "milestone_received") {
    return { stage: "handover_pending", payment_status: "received" };
  }
  if (action === "handover_scheduled") {
    return { stage: "handover_pending", handover_status: "scheduled", expected_handover_at: now };
  }
  if (action === "handover_completed") {
    return { stage: "closed", handover_status: "completed" };
  }
  if (action === "cancel") {
    return { stage: "cancelled", handover_status: "cancelled", payment_status: "disputed" };
  }
  return {};
}

export default function OpsDevelopers({ desk = "prospects" }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: current } = useCurrentUserRole();
  const [form, setForm] = useState(initialProspectForm);

  const { data: workspace = emptyWorkspace } = useQuery({
    queryKey: ["ops-developer-workspace"],
    queryFn: () => listDeveloperOpsWorkspace(),
    initialData: emptyWorkspace,
  });

  const inventory = useMemo(
    () => buildDeveloperInventoryTree(workspace.organisations, workspace.projects, workspace.listings),
    [workspace.organisations, workspace.projects, workspace.listings]
  );
  const hasOperationalStarter = hasOperationalStarterWorkspace(workspace);
  const starterOrganisation = workspace.organisations.find((item) => item.slug === DEMO_OPERATIONAL_DEVELOPER_SLUG) || null;
  const starterDeal = workspace.deals.find((item) => item.deal_code === DEMO_OPERATIONAL_DEAL_CODE) || null;
  const missingSchemas = getMissingEntitySchemas(developerLifecycleSchemaNames);
  const publishRequiredReason = missingSchemas.length
    ? `Developer lifecycle schemas are not published in this Base44 app yet. Open Base44.com and click Publish. Missing: ${missingSchemas.join(", ")}.`
    : "";

  const summary = [
    { label: "Prospects", value: String(workspace.prospects.filter((item) => item.stage !== "archived").length) },
    { label: "Signed developers", value: String(workspace.organisations.filter((item) => item.status !== "archived").length) },
    { label: "Live deals", value: String(workspace.deals.filter((item) => !["closed", "cancelled"].includes(item.stage)).length) },
    { label: "Pending reviews", value: String(workspace.listingRevisions.filter((item) => ["submitted", "under_review"].includes(item.review_status)).length + workspace.projectRevisions.filter((item) => ["submitted", "under_review"].includes(item.review_status)).length) },
  ];

  const deskItems = [
    {
      label: "Prospects",
      path: "/ops/developers/prospects",
      description: "Prospecting, outreach, ownership, follow-up, and conversion into signed developers.",
      value: workspace.prospects.filter((item) => item.stage !== "archived").length,
    },
    {
      label: "Signed developers",
      path: "/ops/developers/registry",
      description: "Operational registry of developer organisations with project, listing, and deal counts.",
      value: workspace.organisations.filter((item) => item.status !== "archived").length,
    },
    {
      label: "Agreements",
      path: "/ops/developers/agreements",
      description: "Agreement status, reminders, signatures, and contract visibility.",
      value: workspace.agreements.length,
    },
    {
      label: "Inventory",
      path: "/ops/developers/inventory",
      description: "Developer → project → listing ownership map with reassignment and bulk tools.",
      value: workspace.listings.length,
    },
    {
      label: "Deals",
      path: "/ops/developers/deals",
      description: "Reservation, contract, payment, handover, and internal deal progression.",
      value: workspace.deals.length,
    },
    {
      label: "Public publishing",
      path: "/ops/developers/publishing",
      description: "Keep public developer pages separate from the internal operational record.",
      value: workspace.developerProfiles.length,
    },
  ];

  const getSchemaAwareErrorDescription = (error, fallbackMessage) => {
    const liveMissingSchemas = getMissingEntitySchemas(developerLifecycleSchemaNames);
    const message = String(error?.message || "");

    if (message.startsWith("SchemaMissing:") || liveMissingSchemas.length) {
      return `Developer lifecycle schemas are not published in this Base44 app yet. Open Base44.com and click Publish. Missing: ${liveMissingSchemas.join(", ")}.`;
    }

    return getBase44ErrorText(error) || fallbackMessage;
  };

  const ensureWrite = (result, fallbackMessage, entityName = "") => {
    if (!result?.ok) {
      if (result?.missingSchema) {
        throw new Error(`SchemaMissing:${entityName || "DeveloperLifecycle"}`);
      }
      throw result?.error || new Error(fallbackMessage);
    }
    return result.data;
  };

  const saveProspect = useMutation({
    mutationFn: async () => {
      const result = await createEntitySafe("DeveloperProspect", {
        ...form,
        owner_user_id: form.owner_user_id || current?.user?.id,
        next_follow_up_at: form.next_follow_up_at || undefined,
      });
      if (!result.ok) {
        if (result.missingSchema) throw new Error("SchemaMissing:DeveloperProspect");
        throw result.error || new Error("Prospect save failed");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      setForm(initialProspectForm);
      toast({ title: "Prospect saved" });
    },
    onError: (error) => toast({
      title: "Prospect save failed",
      description: getSchemaAwareErrorDescription(error, "The prospect could not be saved."),
      variant: "destructive",
    }),
  });

  const bulkImportProspects = useMutation({
    mutationFn: async (records = []) => {
      const saved = [];
      for (const record of records) {
        const result = await createEntitySafe("DeveloperProspect", {
          company_name: record.company_name,
          main_contact_name: record.main_contact_name || "",
          email: record.email || "",
          phone: record.phone || "",
          source: record.source || "",
          owner_user_id: record.owner_user_id || current?.user?.id,
          stage: record.stage || "uncontacted",
          interest: record.interest || "medium",
          last_contact_at: normalizeImportDateTime(record.last_contact_at),
          next_follow_up_at: normalizeImportDateTime(record.next_follow_up_at),
          agreement_status: record.agreement_status || undefined,
          signature_status: record.signature_status || undefined,
          notes: record.notes || "",
        });
        if (!result.ok) {
          if (result.missingSchema) throw new Error("SchemaMissing:DeveloperProspect");
          throw result.error || new Error(`Prospect import failed for ${record.company_name}`);
        }
        saved.push(result.data);
      }
      return saved;
    },
    onSuccess: (records) => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({
        title: "Prospects imported",
        description: `${records.length} prospect records were created from CSV.`,
      });
    },
    onError: (error) => toast({
      title: "Prospect import failed",
      description: getSchemaAwareErrorDescription(error, "The CSV import could not be completed."),
      variant: "destructive",
    }),
  });

  const prospectAction = useMutation({
    mutationFn: async ({ prospect, action, value }) => {
      const now = new Date().toISOString();
      if (action === "stage") return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { stage: value }), "Stage update failed", "DeveloperProspect");
      if (action === "own") return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { owner_user_id: current?.user?.id }), "Owner update failed", "DeveloperProspect");
      if (["call", "email", "meeting"].includes(action)) {
        ensureWrite(await createDeveloperActivity({
          developer_prospect_id: prospect.id,
          activity_type: action,
          direction: "outbound",
          actor_user_id: current?.user?.id,
          occurred_at: now,
          summary: `${prospect.company_name} ${action}`,
        }), "Prospect activity log failed", "DeveloperActivity");
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { last_contact_at: now }), "Prospect activity update failed", "DeveloperProspect");
      }
      if (action === "send_agreement") {
        ensureWrite(await createEntitySafe("DeveloperAgreement", {
          developer_prospect_id: prospect.id,
          agreement_type: "developer_partnership",
          agreement_status: "sent",
          signature_status: "pending",
          sent_at: now,
        }), "Agreement creation failed", "DeveloperAgreement");
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, {
          stage: "agreement_sent",
          agreement_status: "sent",
          signature_status: "pending",
          last_contact_at: now,
        }), "Prospect agreement state update failed", "DeveloperProspect");
      }
      if (action === "send_reminder") {
        ensureWrite(await createDeveloperActivity({
          developer_prospect_id: prospect.id,
          activity_type: "reminder",
          direction: "system",
          actor_user_id: current?.user?.id,
          occurred_at: now,
          summary: `Reminder sent to ${prospect.company_name}`,
        }), "Reminder log failed", "DeveloperActivity");
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, {
          stage: "awaiting_signature",
          agreement_status: "awaiting_signature",
          signature_status: "pending",
          last_contact_at: now,
        }), "Prospect reminder update failed", "DeveloperProspect");
      }
      if (action === "not_interested") {
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { stage: "not_interested" }), "Prospect status update failed", "DeveloperProspect");
      }
      if (action === "archive") {
        return ensureWrite(await updateEntitySafe("DeveloperProspect", prospect.id, { stage: "archived", archived_at: now }), "Prospect archive failed", "DeveloperProspect");
      }
      if (action === "convert") return ensureWrite(await convertProspectToOrganisation({ prospect, currentUserId: current?.user?.id }), "Prospect conversion failed", "DeveloperOrganisation");
      throw new Error("Unsupported action");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({ title: "Developer workflow updated" });
    },
    onError: (error) => toast({
      title: "Developer workflow update failed",
      description: getSchemaAwareErrorDescription(error, "The developer workflow could not be updated."),
      variant: "destructive",
    }),
  });

  const createOperationalStarter = useMutation({
    mutationFn: () => createDeveloperOperationalStarterSet({ currentUserId: current?.user?.id, workspace }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      navigate("/ops/developers/registry");
      toast({
        title: "Operational starter created",
        description: "Prospects, signed developer, inventory, deal, documents, and finance starter records are ready to review.",
      });
    },
    onError: (error) => {
      toast({
        title: "Operational starter failed",
        description: getSchemaAwareErrorDescription(error, "The starter records could not be created."),
        variant: "destructive",
      });
    },
  });

  const reassignProject = useMutation({
    mutationFn: async ({ projectId, developerOrganisationId }) => {
      return ensureWrite(await updateEntitySafe("Project", projectId, {
        developer_organisation_id: developerOrganisationId || "",
        developer_id: developerOrganisationId || "",
      }), "Project reassignment failed", "Project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({ title: "Project reassigned" });
    },
    onError: () => toast({ title: "Project reassignment failed", variant: "destructive" }),
  });

  const reassignListing = useMutation({
    mutationFn: async ({ listingId, developerOrganisationId, projectId }) => {
      return ensureWrite(await updateEntitySafe("Listing", listingId, {
        developer_organisation_id: developerOrganisationId || "",
        developer_id: developerOrganisationId || "",
        project_id: projectId || "",
      }), "Listing reassignment failed", "Listing");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({ title: "Listing reassigned" });
    },
    onError: () => toast({ title: "Listing reassignment failed", variant: "destructive" }),
  });

  const bulkReassign = useMutation({
    mutationFn: async ({ projectAssignments = [], listingAssignments = [] }) => {
      for (const assignment of projectAssignments) {
        await ensureWrite(await updateEntitySafe("Project", assignment.projectId, {
          developer_organisation_id: assignment.developerOrganisationId || "",
          developer_id: assignment.developerOrganisationId || "",
        }), "Bulk project reassignment failed", "Project");
      }
      for (const assignment of listingAssignments) {
        await ensureWrite(await updateEntitySafe("Listing", assignment.listingId, {
          developer_organisation_id: assignment.developerOrganisationId || "",
          developer_id: assignment.developerOrganisationId || "",
          project_id: assignment.projectId || "",
        }), "Bulk listing reassignment failed", "Listing");
      }
      return { projectAssignments, listingAssignments };
    },
    onSuccess: ({ projectAssignments, listingAssignments }) => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({
        title: "Bulk reassignment complete",
        description: `${projectAssignments.length} projects and ${listingAssignments.length} listings were updated.`,
      });
    },
    onError: () => toast({ title: "Bulk reassignment failed", variant: "destructive" }),
  });

  const progressDeal = useMutation({
    mutationFn: async ({ deal, action }) => {
      const now = new Date().toISOString();
      const payload = buildDealWorkflowPayload(action, now);
      return ensureWrite(await updateEntitySafe("DeveloperDeal", deal.id, payload), "Developer deal update failed", "DeveloperDeal");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({ title: "Deal desk updated" });
    },
    onError: () => toast({ title: "Deal desk update failed", variant: "destructive" }),
  });

  const renderDesk = () => {
    if (desk === "registry") {
      return (
        <DeveloperRegistryTab
          organisations={workspace.organisations}
          projects={workspace.projects}
          listings={workspace.listings}
          deals={workspace.deals}
        />
      );
    }

    if (desk === "agreements") {
      return (
        <DeveloperAgreementsTab
          agreements={workspace.agreements}
          organisations={workspace.organisations}
          prospects={workspace.prospects}
        />
      );
    }

    if (desk === "inventory") {
      return (
        <DeveloperInventoryTab
          inventory={inventory}
          organisations={workspace.organisations}
          projects={workspace.projects}
          listings={workspace.listings}
          loading={reassignProject.isPending || reassignListing.isPending || bulkReassign.isPending}
          onReassignProject={(payload) => reassignProject.mutate(payload)}
          onReassignListing={(payload) => reassignListing.mutate(payload)}
          onBulkReassign={(payload) => bulkReassign.mutate(payload)}
        />
      );
    }

    if (desk === "deals") {
      return (
        <DeveloperDealsTab
          deals={workspace.deals}
          organisations={workspace.organisations}
          projects={workspace.projects}
          listings={workspace.listings}
          loading={progressDeal.isPending}
          onAction={(deal, action) => progressDeal.mutate({ deal, action })}
        />
      );
    }

    if (desk === "publishing") {
      return <DeveloperPublicPublishingTab />;
    }

    return (
      <DeveloperProspectsTab
        prospects={workspace.prospects}
        form={form}
        setForm={setForm}
        onSubmit={() => saveProspect.mutate()}
        onAction={(prospect, action, value) => prospectAction.mutate({ prospect, action, value })}
        onImport={(records) => bulkImportProspects.mutate(records)}
        importing={bulkImportProspects.isPending}
        loading={saveProspect.isPending || prospectAction.isPending}
        currentUserId={current?.user?.id || ""}
        disabledReason={publishRequiredReason}
      />
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title="Developers"
        description="Keep developer prospecting, agreements, inventory ownership, and deal progression in dedicated desks instead of one crowded page."
      />

      <AccessGuard permission="settings.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>

      <OpsDeskNav items={deskItems} />

      {missingSchemas.length ? (
        <Card className="rounded-[2rem] border-amber-300/60 bg-amber-50">
          <CardContent className="space-y-2 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-700">Publish required</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Developer lifecycle records need live Base44 schemas</h2>
            <p className="text-sm leading-6 text-slate-700">{publishRequiredReason}</p>
          </CardContent>
        </Card>
      ) : null}

      <AccessGuard permission="settings.manage">
        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Operational starter</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create a complete developer lifecycle starter set</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Seed one strategic prospect plus one signed developer with agreements, inventory, review requests, a live deal, documents, and finance records so the full lifecycle can be reviewed immediately.
              </p>
              {hasOperationalStarter ? (
                <p className="text-sm text-muted-foreground">
                  Starter already present: {starterOrganisation?.trading_name || starterOrganisation?.legal_name || "Developer"} and {starterDeal?.deal_code || DEMO_OPERATIONAL_DEAL_CODE}.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => createOperationalStarter.mutate()} disabled={createOperationalStarter.isPending || missingSchemas.length > 0 || hasOperationalStarter}>
                {hasOperationalStarter ? "Operational starter already created" : createOperationalStarter.isPending ? "Creating..." : "Create operational starter"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AccessGuard>

      {renderDesk()}
    </div>
  );
}
