import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import WorkflowDialog from "@/components/common/WorkflowDialog";
import QueueCard from "@/components/common/QueueCard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { Button } from "@/components/ui/button";
import { compactLabel } from "@/lib/concierge";

export default function PartnerConcierge() {
  const { data: current } = useCurrentUserRole();
  const queryClient = useQueryClient();

  const { data: workspace = { partnerAgencyId: "", cases: [], referrals: [], viewingStops: [], viewingPlans: [], notes: [], documents: [] } } = useQuery({
    queryKey: ["partner-concierge-workspace", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, cases, referrals, viewingPlans, viewingStops, notes, documents] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        base44.entities.ConciergeCase.list("-updated_date", 200),
        base44.entities.ServiceReferral.list("-updated_date", 200),
        base44.entities.ViewingPlan.list("-updated_date", 200),
        base44.entities.ViewingStop.list("-updated_date", 300),
        base44.entities.ConciergeNote.list("-updated_date", 300),
        base44.entities.SecureDocument.list("-updated_date", 300)
      ]);

      const partnerAgencyId = profiles[0]?.partner_agency_id || "";
      const partnerCases = cases.filter((item) => item.primary_partner_id === partnerAgencyId);
      const partnerCaseIds = new Set(partnerCases.map((item) => item.id));
      return {
        partnerAgencyId,
        cases: partnerCases,
        referrals: referrals.filter((item) => item.partner_id === partnerAgencyId && partnerCaseIds.has(item.case_id)),
        viewingPlans: viewingPlans.filter((item) => partnerCaseIds.has(item.case_id)),
        viewingStops: viewingStops.filter((item) => partnerCaseIds.has(item.case_id)),
        notes: notes.filter((item) => partnerCaseIds.has(item.case_id) && item.visibility === "partner_visible"),
        documents: documents.filter((item) => partnerCaseIds.has(item.case_id) && ["partner_visible", "client_visible"].includes(item.visibility))
      };
    },
    initialData: { partnerAgencyId: "", cases: [], referrals: [], viewingStops: [], viewingPlans: [], notes: [], documents: [] }
  });

  const partnerAction = useMutation({
    mutationFn: (payload) => base44.functions.invoke("partnerManageConciergeCase", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-concierge-workspace", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
  });

  const summary = [
    { label: "Active cases", value: String(workspace.cases.filter((item) => !["closed_won", "closed_lost", "archived"].includes(item.case_status)).length) },
    { label: "Awaiting partner", value: String(workspace.cases.filter((item) => item.case_status === "waiting_on_partner").length) },
    { label: "Open referrals", value: String(workspace.referrals.filter((item) => !["completed", "rejected", "cancelled"].includes(item.status)).length) },
    { label: "Upcoming viewings", value: String(workspace.viewingStops.filter((item) => item.scheduled_at && new Date(item.scheduled_at) >= new Date() && !["completed", "cancelled"].includes(item.status)).length) },
    { label: "Shared documents", value: String(workspace.documents.length) }
  ];

  const caseItems = workspace.cases.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.case_code,
    meta: [compactLabel(item.case_type), item.summary].filter(Boolean).join(" · "),
    status: item.case_status,
    badges: [item.priority, item.is_private_inventory ? "private_inventory" : null].filter(Boolean),
    source: item
  }));

  const referralItems = workspace.referrals.slice(0, 8).map((item) => ({
    id: item.id,
    title: compactLabel(item.service_type),
    meta: [item.case_id, item.notes].filter(Boolean).join(" · "),
    status: item.status,
    source: item
  }));

  const viewingItems = workspace.viewingStops.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.listing_id || item.area_label || "Viewing stop",
    meta: [item.case_id, item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : null, item.meeting_point].filter(Boolean).join(" · "),
    status: item.status,
    source: item
  }));

  const documentItems = workspace.documents.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    meta: [compactLabel(item.document_type), compactLabel(item.visibility)].filter(Boolean).join(" · "),
    status: item.security_level,
    source: item
  }));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Concierge" title="Partner coordination for premium cases" description="Partners see only the commercial and viewing surfaces they need: assigned premium cases, service referrals, itinerary coordination, and shared documents." />
      <AdminSummaryStrip items={summary} />
      {workspace.partnerAgencyId ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <QueueCard
            title="Assigned premium cases"
            items={caseItems}
            emptyMessage="No partner-linked concierge cases yet."
            formatStatus={compactLabel}
            renderActions={(item) => (
              <>
                <WorkflowDialog
                  title="Add partner note"
                  description="Add a case update or coordination note for the internal concierge team."
                  actionLabel="Add note"
                  loading={partnerAction.isPending}
                  fields={[{ key: "content", label: "Partner note", type: "textarea", required: true }]}
                  onSubmit={(form) => partnerAction.mutate({ action: "add_partner_note", case_id: item.source.id, content: form.content })}
                >
                  <Button variant="outline">Add note</Button>
                </WorkflowDialog>
                <WorkflowDialog
                  title="Upload document"
                  description="Upload partner-visible evidence or coordination documents."
                  actionLabel="Upload"
                  loading={partnerAction.isPending}
                  fields={[
                    { key: "title", label: "Title", required: true },
                    { key: "document_type", label: "Document type", required: true },
                    { key: "file_url", label: "File URL", required: true },
                    { key: "notes", label: "Notes", type: "textarea" }
                  ]}
                  onSubmit={(form) => partnerAction.mutate({ action: "upload_document", case_id: item.source.id, title: form.title, document_type: form.document_type, file_url: form.file_url, notes: form.notes })}
                >
                  <Button variant="outline">Upload doc</Button>
                </WorkflowDialog>
              </>
            )}
          />

          <QueueCard
            title="Service referrals"
            items={referralItems}
            emptyMessage="No active referrals."
            formatStatus={compactLabel}
            renderActions={(item) => (
              <>
                {item.source.status === "sent" ? (
                  <Button variant="outline" onClick={() => partnerAction.mutate({ action: "accept_service_referral", case_id: item.source.case_id, referral_id: item.source.id })}>Accept</Button>
                ) : null}
                {["accepted", "in_progress"].includes(item.source.status) ? (
                  <WorkflowDialog
                    title="Complete referral"
                    description="Mark this referral complete and add a short outcome note."
                    actionLabel="Complete"
                    loading={partnerAction.isPending}
                    fields={[{ key: "notes", label: "Outcome note", type: "textarea" }]}
                    onSubmit={(form) => partnerAction.mutate({ action: "complete_service_referral", case_id: item.source.case_id, referral_id: item.source.id, notes: form.notes })}
                  >
                    <Button variant="outline">Complete</Button>
                  </WorkflowDialog>
                ) : null}
              </>
            )}
          />

          <QueueCard
            title="Viewing coordination"
            items={viewingItems}
            emptyMessage="No viewing coordination items."
            formatStatus={compactLabel}
            renderActions={(item) => (
              <WorkflowDialog
                title="Update viewing stop"
                description="Update the partner side of this viewing appointment."
                actionLabel="Save update"
                loading={partnerAction.isPending}
                fields={[
                  { key: "status", label: "Status", type: "select", options: ["confirmed", "rescheduled", "cancelled", "completed", "no_show"], required: true },
                  { key: "scheduled_at", label: "Scheduled at", type: "date" },
                  { key: "meeting_point", label: "Meeting point" },
                  { key: "notes", label: "Notes", type: "textarea" }
                ]}
                initialValues={{ status: item.source.status }}
                onSubmit={(form) => partnerAction.mutate({ action: "update_viewing_stop", case_id: item.source.case_id, viewing_stop_id: item.source.id, status: form.status, scheduled_at: form.scheduled_at, meeting_point: form.meeting_point, notes: form.notes })}
              >
                <Button variant="outline">Update</Button>
              </WorkflowDialog>
            )}
          />

          <QueueCard title="Shared documents" items={documentItems} emptyMessage="No shared documents yet." formatStatus={compactLabel} />
        </div>
      ) : <EmptyStateCard title="Partner profile missing" description="Link this user to a partner agency before using the concierge coordination workspace." />}
    </div>
  );
}
