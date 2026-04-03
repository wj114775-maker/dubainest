import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import LeadOwnershipTable from "@/components/ops/LeadOwnershipTable";
import PartnerLeadActionPanel from "@/components/leads/PartnerLeadActionPanel";
import PartnerLeadHistoryPanel from "@/components/leads/PartnerLeadHistoryPanel";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { useToast } from "@/components/ui/use-toast";

export default function PartnerLeads() {
  const { data: current } = useCurrentUserRole();
  const [selectedLead, setSelectedLead] = useState(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const assignmentMutation = useMutation({
    mutationFn: ({ leadId, assignmentId, action, notes, outcome, scheduled_at }) => base44.functions.invoke("partnerHandleLeadAssignment", {
      lead_id: leadId,
      assignment_id: assignmentId,
      action,
      notes,
      outcome,
      scheduled_at,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-leads", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["partner-revenue-workspace", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["partner-disputes", current.user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
      toast({ title: "Lead updated" });
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["partner-leads", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, leadsData, assignments, events, attempts, viewings] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        base44.entities.Lead.list("-updated_date", 200),
        base44.entities.LeadAssignment.list("-updated_date", 200),
        base44.entities.LeadEvent.list("-updated_date", 300),
        base44.entities.LeadContactAttempt.list("-updated_date", 300),
        base44.entities.Viewing.list("-updated_date", 300),
      ]);

      const partnerAgencyId = profiles[0]?.partner_agency_id;
      const partnerLeadIds = new Set(
        assignments
          .filter((item) => item.partner_id === partnerAgencyId)
          .map((item) => item.lead_id)
      );

      return leadsData
        .filter((lead) => lead.partner_agency_id === partnerAgencyId || lead.assigned_partner_id === partnerAgencyId || partnerLeadIds.has(lead.id))
        .map((lead) => {
          const assignment = assignments.find((item) => item.lead_id === lead.id && item.partner_id === partnerAgencyId);
          const overdue = assignment?.sla_due_at ? new Date(assignment.sla_due_at) < new Date() : false;
          const history = [
            ...events.filter((item) => item.lead_id === lead.id).map((item) => ({ id: `event-${item.id}`, label: item.event_type || 'event', value: item.summary || '—' })),
            ...attempts.filter((item) => item.lead_id === lead.id).map((item) => ({ id: `attempt-${item.id}`, label: item.channel || 'contact', value: [item.outcome, item.attempt_at].filter(Boolean).join(' · ') || '—' })),
            ...viewings.filter((item) => item.lead_id === lead.id).map((item) => ({ id: `viewing-${item.id}`, label: item.status || 'viewing', value: [item.scheduled_at, item.completion_notes].filter(Boolean).join(' · ') || '—' }))
          ].slice(0, 6);
          return {
            id: lead.id,
            assignment_id: assignment?.id,
            summary: `${lead.intent_type || lead.source || "Lead"} · ${lead.priority || "standard"}${overdue ? ' · SLA overdue' : ''}`,
            fingerprint: lead.lead_code || lead.id,
            status: lead.status || "new",
            ownership_status: lead.ownership_status || "unowned",
            anti_circumvention_flag: lead.is_circumvention_flagged || lead.ownership_status === "protected",
            assignment,
            timeline: [assignment?.assignment_reason, assignment?.sla_due_at, lead.notes_summary].filter(Boolean).join(" · "),
            history
          };
        });
    },
    initialData: [],
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Lead inbox" title="Protected lead handling for partner teams" description="Every protected action can become an attributable lead with lock logic, anti-circumvention checks and immutable history." />
      <LeadOwnershipTable
        leads={leads}
        getActions={(lead) => {
          if (!lead.assignment_id || assignmentMutation.isPending) return [];
          return [
            { label: "Open action", onClick: () => setSelectedLead(lead) },
            { label: "Accept", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "accept" }) },
            { label: "Reject", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "reject" }) }
          ];
        }}
      />
      {selectedLead ? <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <PartnerLeadActionPanel lead={selectedLead} assignment={selectedLead.assignment} loading={assignmentMutation.isPending} onSubmit={(payload) => assignmentMutation.mutate({ leadId: selectedLead.id, assignmentId: selectedLead.assignment_id, ...payload })} />
        <PartnerLeadHistoryPanel items={selectedLead.history || []} />
      </div> : null}
    </div>
  );
}
