import React from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import WorkflowDialog from "@/components/common/WorkflowDialog";
import AccessGuard from "@/components/admin/AccessGuard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  compactLabel,
  conciergeCaseStatusOptions,
  conciergePriorityOptions,
  confidentialityOptions,
  documentVisibilityOptions,
  milestoneStatusOptions,
  noteTypeOptions,
  securityLevelOptions,
  serviceStatusOptions,
  serviceTypeOptions,
  taskStatusOptions
} from "@/lib/concierge";

function DataListCard({ title, items = [], render, emptyMessage = "No records yet." }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map(render) : <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
      </CardContent>
    </Card>
  );
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value || "{}");
  } catch (_error) {
    return {};
  }
}

export default function OpsConciergeDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-concierge-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const caseRecord = await base44.entities.ConciergeCase.get(id);
      const [milestones, tasks, participants, inventoryRequests, ndaRecords, documents, referrals, viewingPlans, viewingStops, notes, timeline, audit, preferences] = await Promise.all([
        base44.entities.ConciergeMilestone.filter({ case_id: id }),
        base44.entities.ConciergeTask.filter({ case_id: id }),
        base44.entities.CaseParticipant.filter({ case_id: id }),
        base44.entities.PrivateInventoryRequest.filter({ case_id: id }),
        base44.entities.NDATracking.filter({ case_id: id }),
        base44.entities.SecureDocument.filter({ case_id: id }),
        base44.entities.ServiceReferral.filter({ case_id: id }),
        base44.entities.ViewingPlan.filter({ case_id: id }),
        base44.entities.ViewingStop.filter({ case_id: id }),
        base44.entities.ConciergeNote.filter({ case_id: id }),
        base44.entities.ClientJourneyEvent.filter({ case_id: id }),
        base44.entities.AuditLog.filter({ entity_id: id }),
        base44.entities.ClientPreferenceProfile.filter({ case_id: id })
      ]);
      return {
        caseRecord,
        milestones,
        tasks,
        participants,
        inventoryRequests,
        nda: ndaRecords[0] || null,
        documents,
        referrals,
        viewingPlans,
        viewingStops,
        notes,
        timeline,
        audit,
        preferences: preferences[0] || null
      };
    },
    initialData: null
  });

  const mutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke("internalManageConciergeCase", { case_id: id, ...payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-concierge-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-concierge-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["ops-dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
  });

  if (isLoading || !data?.caseRecord) {
    return <div className="text-sm text-muted-foreground">Loading concierge workspace...</div>;
  }

  const {
    caseRecord,
    milestones,
    tasks,
    participants,
    inventoryRequests,
    nda,
    documents,
    referrals,
    viewingPlans,
    viewingStops,
    notes,
    timeline,
    audit,
    preferences
  } = data;

  const buyerParticipant = participants.find((item) => item.participant_type === "buyer");
  const stopsByPlan = viewingStops.reduce((accumulator, item) => {
    accumulator[item.viewing_plan_id] = accumulator[item.viewing_plan_id] || [];
    accumulator[item.viewing_plan_id].push(item);
    return accumulator;
  }, {});

  return (
    <AccessGuard permission="concierge_cases.read">
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Premium case detail"
          title={caseRecord.case_code}
          description="Run the premium client case across NDA, tasks, private inventory, itinerary planning, service referrals, secure documents, and audit history."
        />

        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardContent className="flex flex-wrap items-center gap-3 p-5">
            <Badge variant="outline">{compactLabel(caseRecord.case_status)}</Badge>
            <Badge variant="outline">{compactLabel(caseRecord.case_type)}</Badge>
            <Badge variant="outline">{compactLabel(caseRecord.priority)}</Badge>
            {caseRecord.is_private_inventory ? <Badge variant="outline">Private Inventory</Badge> : null}
            {caseRecord.is_hnw ? <Badge variant="outline">HNW</Badge> : null}
            {caseRecord.is_golden_visa_case ? <Badge variant="outline">Golden Visa</Badge> : null}
            {caseRecord.sla_status ? <Badge variant="outline">{compactLabel(caseRecord.sla_status)}</Badge> : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1fr,340px]">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="profile">Buyer Profile</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="participants">Participants</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="inventory">Inventory Requests</TabsTrigger>
              <TabsTrigger value="viewings">Viewings</TabsTrigger>
              <TabsTrigger value="referrals">Service Referrals</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="audit">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="rounded-[2rem] border-white/10 bg-card/80">
                <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Lead: {caseRecord.lead_id || "—"}</p>
                    <p>Buyer user: {caseRecord.buyer_user_id || "—"}</p>
                    <p>Partner: {caseRecord.primary_partner_id || "—"}</p>
                    <p>Assigned concierge: {caseRecord.assigned_concierge_id || "—"}</p>
                    <p>Internal team: {caseRecord.assigned_internal_team || "—"}</p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Service tier: {compactLabel(caseRecord.service_tier)}</p>
                    <p>Confidentiality: {compactLabel(caseRecord.confidentiality_level)}</p>
                    <p>SLA due: {caseRecord.next_sla_due_at ? new Date(caseRecord.next_sla_due_at).toLocaleString() : "—"}</p>
                    <p>Opened: {caseRecord.opened_at ? new Date(caseRecord.opened_at).toLocaleString() : "—"}</p>
                    <p>Summary: {caseRecord.summary || "—"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card className="rounded-[2rem] border-white/10 bg-card/80">
                <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Name: {buyerParticipant?.name || "—"}</p>
                    <p>Email: {buyerParticipant?.email || "—"}</p>
                    <p>Phone: {buyerParticipant?.phone || "—"}</p>
                    <p>Organisation: {buyerParticipant?.organisation || "—"}</p>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Budget: {caseRecord.budget_min || caseRecord.budget_max ? `${caseRecord.budget_min || 0} - ${caseRecord.budget_max || 0}` : "—"}</p>
                    <p>Objective: {caseRecord.property_objective || "—"}</p>
                    <p>Timeframe: {caseRecord.buying_timeframe || "—"}</p>
                    <p>Preferred areas: {(caseRecord.preferred_areas || []).join(", ") || "—"}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card className="rounded-[2rem] border-white/10 bg-card/80">
                <CardHeader><CardTitle>Preference profile</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <pre className="overflow-auto rounded-2xl border border-white/10 bg-muted/20 p-4 text-xs text-muted-foreground">{JSON.stringify(preferences || {}, null, 2)}</pre>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="participants">
              <DataListCard
                title="Case participants"
                items={participants}
                render={(item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p>{[compactLabel(item.participant_type), item.role_in_case, item.organisation].filter(Boolean).join(" · ")}</p>
                    <p>{[item.email, item.phone].filter(Boolean).join(" · ") || "No direct contact added."}</p>
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="milestones">
              <DataListCard
                title="Milestones"
                items={milestones}
                render={(item) => (
                  <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{compactLabel(item.status)}</Badge>
                      <Badge variant="outline">{compactLabel(item.milestone_type)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p>{item.due_date ? `Due ${new Date(item.due_date).toLocaleString()}` : "No due date set."}</p>
                      <p>{item.notes || "No notes yet."}</p>
                    </div>
                    {item.status !== "completed" ? (
                      <WorkflowDialog
                        title="Complete milestone"
                        description="Mark this milestone complete and preserve the case history."
                        actionLabel="Complete"
                        loading={mutation.isPending}
                        fields={[{ key: "notes", label: "Completion note", type: "textarea" }]}
                        onSubmit={(form) => mutation.mutate({ action: "complete_milestone", milestone_id: item.id, notes: form.notes })}
                      >
                        <Button variant="outline">Complete</Button>
                      </WorkflowDialog>
                    ) : null}
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="tasks">
              <DataListCard
                title="Tasks"
                items={tasks}
                render={(item) => (
                  <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{compactLabel(item.status)}</Badge>
                      <Badge variant="outline">{compactLabel(item.priority)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p>{[item.assigned_to, item.due_date ? `Due ${new Date(item.due_date).toLocaleString()}` : null].filter(Boolean).join(" · ") || "Unassigned"}</p>
                      <p>{item.description || "No description recorded."}</p>
                    </div>
                    {item.status !== "completed" ? (
                      <WorkflowDialog
                        title="Complete task"
                        description="Close this concierge task and preserve the audit history."
                        actionLabel="Complete task"
                        loading={mutation.isPending}
                        fields={[{ key: "notes", label: "Completion note", type: "textarea" }]}
                        onSubmit={(form) => mutation.mutate({ action: "complete_task", task_id: item.id, notes: form.notes })}
                      >
                        <Button variant="outline">Complete</Button>
                      </WorkflowDialog>
                    ) : null}
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="inventory">
              <DataListCard
                title="Private inventory requests"
                items={inventoryRequests}
                render={(item) => (
                  <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{compactLabel(item.request_status)}</Badge>
                      <Badge variant="outline">{compactLabel(item.confidentiality_level)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{item.request_summary || "Private inventory request"}</p>
                      <p>{[item.request_scope, item.assigned_to].filter(Boolean).join(" · ") || "No scope set."}</p>
                      <p>{item.notes || "No notes recorded."}</p>
                    </div>
                    {!["fulfilled", "rejected", "revoked", "shared"].includes(item.request_status) ? (
                      <WorkflowDialog
                        title="Resolve private inventory request"
                        description="Move the private inventory request into approved, shared, or another resolved state."
                        actionLabel="Update request"
                        loading={mutation.isPending}
                        fields={[
                          { key: "status", label: "Status", type: "select", options: ["under_review", "approved_for_release", "shared", "fulfilled", "rejected", "revoked"], required: true },
                          { key: "notes", label: "Resolution note", type: "textarea" }
                        ]}
                        initialValues={{ status: "approved_for_release" }}
                        onSubmit={(form) => mutation.mutate({ action: "resolve_private_inventory", private_inventory_request_id: item.id, status: form.status, notes: form.notes })}
                      >
                        <Button variant="outline">Resolve</Button>
                      </WorkflowDialog>
                    ) : null}
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="viewings">
              <DataListCard
                title="Viewing plans"
                items={viewingPlans}
                render={(plan) => (
                  <div key={plan.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{compactLabel(plan.status)}</Badge>
                      <Badge variant="outline">{plan.approved_by_client ? "Client Approved" : "Awaiting Client"}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground">{plan.title}</p>
                      <p>{[plan.date_start ? new Date(plan.date_start).toLocaleString() : null, plan.city].filter(Boolean).join(" · ") || "No schedule set."}</p>
                      <p>{plan.notes || "No plan notes yet."}</p>
                    </div>
                    <div className="space-y-2">
                      {(stopsByPlan[plan.id] || []).map((stop) => (
                        <div key={stop.id} className="rounded-2xl border border-white/10 bg-muted/20 p-3 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{stop.listing_id || stop.area_label || "Viewing stop"}</p>
                          <p>{[compactLabel(stop.status), stop.scheduled_at ? new Date(stop.scheduled_at).toLocaleString() : null, stop.meeting_point].filter(Boolean).join(" · ")}</p>
                          <div className="mt-3">
                            <WorkflowDialog
                              title="Update viewing stop"
                              description="Adjust time, status, or meeting point for this itinerary stop."
                              actionLabel="Save stop"
                              loading={mutation.isPending}
                              fields={[
                                { key: "status", label: "Status", type: "select", options: ["draft", "confirmed", "completed", "cancelled", "rescheduled", "no_show"], required: true },
                                { key: "scheduled_at", label: "Scheduled at", type: "date" },
                                { key: "meeting_point", label: "Meeting point" },
                                { key: "notes", label: "Note", type: "textarea" }
                              ]}
                              initialValues={{ status: stop.status }}
                              onSubmit={(form) => mutation.mutate({ action: "update_viewing_stop", viewing_stop_id: stop.id, status: form.status, scheduled_at: form.scheduled_at, meeting_point: form.meeting_point, notes: form.notes })}
                            >
                              <Button variant="outline">Update stop</Button>
                            </WorkflowDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                    <WorkflowDialog
                      title="Add viewing stop"
                      description="Add another appointment to this itinerary."
                      actionLabel="Add stop"
                      loading={mutation.isPending}
                      fields={[
                        { key: "listing_id", label: "Listing id" },
                        { key: "scheduled_at", label: "Scheduled at", type: "date" },
                        { key: "duration_minutes", label: "Duration minutes", type: "number" },
                        { key: "status", label: "Status", type: "select", options: ["draft", "confirmed", "completed", "cancelled", "rescheduled", "no_show"], required: true },
                        { key: "meeting_point", label: "Meeting point" },
                        { key: "area_label", label: "Area label" },
                        { key: "notes", label: "Note", type: "textarea" }
                      ]}
                      initialValues={{ status: "draft", duration_minutes: 60 }}
                      onSubmit={(form) => mutation.mutate({
                        action: "add_viewing_stop",
                        viewing_plan_id: plan.id,
                        listing_id: form.listing_id,
                        scheduled_at: form.scheduled_at,
                        duration_minutes: Number(form.duration_minutes || 60),
                        status: form.status,
                        meeting_point: form.meeting_point,
                        area_label: form.area_label,
                        notes: form.notes
                      })}
                    >
                      <Button variant="outline">Add stop</Button>
                    </WorkflowDialog>
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="referrals">
              <DataListCard
                title="Service referrals"
                items={referrals}
                render={(item) => (
                  <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{compactLabel(item.status)}</Badge>
                      <Badge variant="outline">{compactLabel(item.service_type)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{[item.partner_id, item.referred_at ? new Date(item.referred_at).toLocaleDateString() : null].filter(Boolean).join(" · ") || "No referral metadata recorded."}</p>
                      <p>{item.notes || "No notes recorded."}</p>
                    </div>
                    {!["completed", "rejected", "cancelled"].includes(item.status) ? (
                      <WorkflowDialog
                        title="Update referral"
                        description="Move the service referral through accepted, in-progress, or completed state."
                        actionLabel="Update referral"
                        loading={mutation.isPending}
                        fields={[
                          { key: "status", label: "Status", type: "select", options: serviceStatusOptions, required: true },
                          { key: "description", label: "Outcome", type: "textarea" },
                          { key: "notes", label: "Note", type: "textarea" }
                        ]}
                        initialValues={{ status: item.status }}
                        onSubmit={(form) => mutation.mutate({ action: "update_service_referral", referral_id: item.id, status: form.status, description: form.description, notes: form.notes })}
                      >
                        <Button variant="outline">Update referral</Button>
                      </WorkflowDialog>
                    ) : null}
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="documents">
              <DataListCard
                title="Secure document room"
                items={documents}
                render={(item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p>{[compactLabel(item.document_type), compactLabel(item.visibility), compactLabel(item.security_level)].filter(Boolean).join(" · ")}</p>
                    <p>{item.notes || "No notes recorded."}</p>
                    {item.file_url ? <a className="text-primary underline-offset-4 hover:underline" href={item.file_url} target="_blank" rel="noreferrer">Open document</a> : null}
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="notes">
              <DataListCard
                title="Private notes"
                items={notes}
                render={(item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{compactLabel(item.note_type)}</p>
                    <p>{item.content}</p>
                    <p>{[compactLabel(item.visibility), item.created_at ? new Date(item.created_at).toLocaleString() : null].filter(Boolean).join(" · ")}</p>
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="timeline">
              <DataListCard
                title="Journey timeline"
                items={timeline}
                render={(item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{item.summary}</p>
                    <p>{[compactLabel(item.event_type), item.created_at ? new Date(item.created_at).toLocaleString() : null].filter(Boolean).join(" · ")}</p>
                  </div>
                )}
              />
            </TabsContent>

            <TabsContent value="audit">
              <DataListCard
                title="Audit trail"
                items={audit}
                render={(item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{item.summary}</p>
                    <p>{[item.action, item.created_date ? new Date(item.created_date).toLocaleString() : null].filter(Boolean).join(" · ")}</p>
                  </div>
                )}
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                <WorkflowDialog title="Assign concierge" description="Set the concierge owner and internal team for this premium case." actionLabel="Assign" loading={mutation.isPending} fields={[{ key: "assigned_concierge_id", label: "Concierge user id", required: true }, { key: "assigned_internal_team", label: "Internal team" }]} onSubmit={(form) => mutation.mutate({ action: "assign_concierge", assigned_concierge_id: form.assigned_concierge_id, assigned_internal_team: form.assigned_internal_team })}><Button variant="outline">Assign concierge</Button></WorkflowDialog>
                <WorkflowDialog title="Change priority" description="Raise or lower the handling band for this case." actionLabel="Save priority" loading={mutation.isPending} fields={[{ key: "priority", label: "Priority", type: "select", options: conciergePriorityOptions, required: true }]} initialValues={{ priority: caseRecord.priority }} onSubmit={(form) => mutation.mutate({ action: "change_priority", priority: form.priority })}><Button variant="outline">Change priority</Button></WorkflowDialog>
                <WorkflowDialog title="Update status" description="Move the case through intake, matching, service, or closure stages." actionLabel="Update status" loading={mutation.isPending} fields={[{ key: "case_status", label: "Case status", type: "select", options: conciergeCaseStatusOptions, required: true }]} initialValues={{ case_status: caseRecord.case_status }} onSubmit={(form) => mutation.mutate({ action: "update_status", case_status: form.case_status })}><Button variant="outline">Update status</Button></WorkflowDialog>
                <WorkflowDialog title="Add milestone" description="Add a manual milestone to the premium journey." actionLabel="Add milestone" loading={mutation.isPending} fields={[{ key: "milestone_type", label: "Milestone type", required: true }, { key: "title", label: "Title", required: true }, { key: "status", label: "Status", type: "select", options: milestoneStatusOptions, required: true }, { key: "due_date", label: "Due date", type: "date" }, { key: "notes", label: "Notes", type: "textarea" }]} initialValues={{ status: "pending" }} onSubmit={(form) => mutation.mutate({ action: "add_milestone", milestone_type: form.milestone_type, title: form.title, status: form.status, due_date: form.due_date, notes: form.notes })}><Button variant="outline">Add milestone</Button></WorkflowDialog>
                <WorkflowDialog title="Add task" description="Create a new operational task inside this case." actionLabel="Add task" loading={mutation.isPending} fields={[{ key: "task_type", label: "Task type", required: true }, { key: "title", label: "Title", required: true }, { key: "description", label: "Description", type: "textarea" }, { key: "assigned_to", label: "Assigned to" }, { key: "priority", label: "Priority", type: "select", options: ["low", "normal", "high", "urgent"], required: true }, { key: "status", label: "Status", type: "select", options: taskStatusOptions, required: true }, { key: "due_date", label: "Due date", type: "date" }]} initialValues={{ priority: "normal", status: "open" }} onSubmit={(form) => mutation.mutate({ action: "add_task", task_type: form.task_type, title: form.title, description: form.description, assigned_to: form.assigned_to, priority: form.priority, status: form.status, due_date: form.due_date })}><Button variant="outline">Add task</Button></WorkflowDialog>
                <WorkflowDialog title="Upload document" description="Add a secure document to the case vault." actionLabel="Upload document" loading={mutation.isPending} fields={[{ key: "document_type", label: "Document type", required: true }, { key: "title", label: "Title", required: true }, { key: "file_url", label: "File URL", required: true }, { key: "visibility", label: "Visibility", type: "select", options: documentVisibilityOptions, required: true }, { key: "security_level", label: "Security level", type: "select", options: securityLevelOptions, required: true }, { key: "notes", label: "Notes", type: "textarea" }]} initialValues={{ visibility: "internal_only", security_level: "confidential" }} onSubmit={(form) => mutation.mutate({ action: "upload_document", document_type: form.document_type, title: form.title, file_url: form.file_url, visibility: form.visibility, security_level: form.security_level, notes: form.notes })}><Button variant="outline">Upload document</Button></WorkflowDialog>
                <WorkflowDialog title="Send NDA" description="Record NDA issuance and notify the client if they are linked to this case." actionLabel="Send NDA" loading={mutation.isPending} fields={[{ key: "required_for", label: "Required for" }, { key: "file_url", label: "NDA document URL" }, { key: "notes", label: "Notes", type: "textarea" }]} onSubmit={(form) => mutation.mutate({ action: "send_nda", required_for: form.required_for, file_url: form.file_url, notes: form.notes })}><Button variant="outline">Send NDA</Button></WorkflowDialog>
                <WorkflowDialog title="Mark NDA received" description="Confirm the signed NDA is back and the restricted workflow can continue." actionLabel="Confirm NDA" loading={mutation.isPending} fields={[{ key: "file_url", label: "Signed NDA URL" }, { key: "notes", label: "Notes", type: "textarea" }]} onSubmit={(form) => mutation.mutate({ action: "mark_nda_received", file_url: form.file_url, notes: form.notes })}><Button variant="outline">Mark NDA received</Button></WorkflowDialog>
                <WorkflowDialog title="Request private inventory" description="Open a controlled request for off-market stock." actionLabel="Open request" loading={mutation.isPending} fields={[{ key: "request_scope", label: "Request scope", required: true }, { key: "request_summary", label: "Summary", type: "textarea", required: true }, { key: "confidentiality_level", label: "Confidentiality", type: "select", options: confidentialityOptions, required: true }, { key: "notes", label: "Notes", type: "textarea" }]} initialValues={{ confidentiality_level: "restricted_private" }} onSubmit={(form) => mutation.mutate({ action: "request_private_inventory", request_scope: form.request_scope, request_summary: form.request_summary, confidentiality_level: form.confidentiality_level, notes: form.notes })}><Button variant="outline">Request private inventory</Button></WorkflowDialog>
                <WorkflowDialog title="Create viewing plan" description="Create the itinerary shell for a Dubai trip or local viewing sequence." actionLabel="Create plan" loading={mutation.isPending} fields={[{ key: "title", label: "Title", required: true }, { key: "status", label: "Status", type: "select", options: ["draft", "awaiting_internal_review", "awaiting_client_approval", "approved", "in_progress", "completed", "cancelled"], required: true }, { key: "date_start", label: "Start date", type: "date" }, { key: "date_end", label: "End date", type: "date" }, { key: "city", label: "City" }, { key: "notes", label: "Notes", type: "textarea" }]} initialValues={{ status: "draft", city: "Dubai" }} onSubmit={(form) => mutation.mutate({ action: "create_viewing_plan", title: form.title, status: form.status, date_start: form.date_start, date_end: form.date_end, city: form.city, notes: form.notes })}><Button variant="outline">Create viewing plan</Button></WorkflowDialog>
                <WorkflowDialog title="Add service referral" description="Track a legal, mortgage, visa, relocation, or similar referral under this case." actionLabel="Add referral" loading={mutation.isPending} fields={[{ key: "service_type", label: "Service type", type: "select", options: serviceTypeOptions, required: true }, { key: "partner_id", label: "Partner id", required: true }, { key: "status", label: "Status", type: "select", options: serviceStatusOptions, required: true }, { key: "notes", label: "Notes", type: "textarea" }]} initialValues={{ status: "sent" }} onSubmit={(form) => mutation.mutate({ action: "add_service_referral", service_type: form.service_type, partner_id: form.partner_id, status: form.status, notes: form.notes })}><Button variant="outline">Add service referral</Button></WorkflowDialog>
                <WorkflowDialog title="Add participant" description="Capture decision-makers and supporting people involved in the case." actionLabel="Add participant" loading={mutation.isPending} fields={[{ key: "participant_type", label: "Participant type", type: "select", options: ["buyer", "spouse", "family_office_representative", "concierge_manager", "broker", "lawyer", "mortgage_adviser", "visa_adviser", "relocation_adviser", "other"], required: true }, { key: "name", label: "Name", required: true }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "organisation", label: "Organisation" }, { key: "role_in_case", label: "Role in case" }, { key: "notes", label: "Notes", type: "textarea" }]} initialValues={{ participant_type: "other" }} onSubmit={(form) => mutation.mutate({ action: "add_participant", participant_type: form.participant_type, name: form.name, email: form.email, phone: form.phone, organisation: form.organisation, role_in_case: form.role_in_case, notes: form.notes })}><Button variant="outline">Add participant</Button></WorkflowDialog>
                <WorkflowDialog title="Add note" description="Add a private or partner-visible note to the case." actionLabel="Add note" loading={mutation.isPending} fields={[{ key: "note_type", label: "Note type", type: "select", options: noteTypeOptions, required: true }, { key: "visibility", label: "Visibility", type: "select", options: ["internal_only", "concierge_only", "partner_visible"], required: true }, { key: "content", label: "Content", type: "textarea", required: true }]} initialValues={{ note_type: "internal_update", visibility: "internal_only" }} onSubmit={(form) => mutation.mutate({ action: "add_note", note_type: form.note_type, visibility: form.visibility, content: form.content })}><Button variant="outline">Add note</Button></WorkflowDialog>
                <WorkflowDialog title="Update preferences" description="Refresh the premium preference profile and service needs." actionLabel="Save preferences" loading={mutation.isPending} fields={[{ key: "risk_profile", label: "Risk profile" }, { key: "lifestyle_preferences_json", label: "Lifestyle JSON", type: "textarea" }, { key: "investment_preferences_json", label: "Investment JSON", type: "textarea" }, { key: "family_requirements_json", label: "Family JSON", type: "textarea" }, { key: "must_have_features_json", label: "Must-have JSON", type: "textarea" }, { key: "deal_breakers_json", label: "Deal-breakers JSON", type: "textarea" }, { key: "travel_preferences_json", label: "Travel JSON", type: "textarea" }, { key: "service_needs_json", label: "Service needs JSON", type: "textarea" }, { key: "privacy_expectations_json", label: "Privacy JSON", type: "textarea" }]} initialValues={{ risk_profile: preferences?.risk_profile || "" }} onSubmit={(form) => mutation.mutate({ action: "update_preferences", risk_profile: form.risk_profile, lifestyle_preferences_json: safeJsonParse(form.lifestyle_preferences_json), investment_preferences_json: safeJsonParse(form.investment_preferences_json), family_requirements_json: safeJsonParse(form.family_requirements_json), must_have_features_json: safeJsonParse(form.must_have_features_json), deal_breakers_json: safeJsonParse(form.deal_breakers_json), travel_preferences_json: safeJsonParse(form.travel_preferences_json), service_needs_json: safeJsonParse(form.service_needs_json), privacy_expectations_json: safeJsonParse(form.privacy_expectations_json) })}><Button variant="outline">Update preferences</Button></WorkflowDialog>
                <WorkflowDialog title="Escalate case" description="Escalate the case into restricted or HNW handling." actionLabel="Escalate case" loading={mutation.isPending} fields={[{ key: "priority", label: "Priority", type: "select", options: conciergePriorityOptions, required: true }, { key: "content", label: "Escalation note", type: "textarea", required: true }]} initialValues={{ priority: caseRecord.priority === "vip" ? "vip" : "urgent" }} onSubmit={(form) => mutation.mutate({ action: "escalate_case", priority: form.priority, content: form.content })}><Button variant="outline">Escalate case</Button></WorkflowDialog>
                <WorkflowDialog title="Close case" description="Close the premium case when it is won, lost, or archived." actionLabel="Close case" loading={mutation.isPending} fields={[{ key: "case_status", label: "Close status", type: "select", options: ["closed_won", "closed_lost", "archived"], required: true }, { key: "notes", label: "Closure note", type: "textarea" }]} initialValues={{ case_status: "closed_won" }} onSubmit={(form) => mutation.mutate({ action: "close_case", case_status: form.case_status, notes: form.notes })}><Button>Close case</Button></WorkflowDialog>
              </CardContent>
            </Card>

            {nda ? (
              <Card className="rounded-[2rem] border-white/10 bg-card/80">
                <CardHeader><CardTitle>NDA status</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Status: {compactLabel(nda.nda_status)}</p>
                  <p>Required for: {nda.required_for || "—"}</p>
                  <p>Sent: {nda.sent_at ? new Date(nda.sent_at).toLocaleString() : "—"}</p>
                  <p>Signed: {nda.signed_at ? new Date(nda.signed_at).toLocaleString() : "—"}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </AccessGuard>
  );
}
