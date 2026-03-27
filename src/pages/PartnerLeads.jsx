import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import LeadOwnershipTable from "@/components/ops/LeadOwnershipTable";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { useToast } from "@/components/ui/use-toast";

export default function PartnerLeads() {
  const { data: current } = useCurrentUserRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const assignmentMutation = useMutation({
    mutationFn: ({ leadId, assignmentId, action, notes, outcome }) => base44.functions.invoke("partnerHandleLeadAssignment", {
      lead_id: leadId,
      assignment_id: assignmentId,
      action,
      notes,
      outcome,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-leads", current.user?.id] });
      toast({ title: "Lead updated" });
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ["partner-leads", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, leadsData, assignments] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        base44.entities.Lead.list("-updated_date", 200),
        base44.entities.LeadAssignment.list("-updated_date", 200),
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
          return {
            id: lead.id,
            assignment_id: assignment?.id,
            summary: `${lead.intent_type || lead.source || "Lead"} · ${lead.priority || "standard"}${overdue ? ' · SLA overdue' : ''}`,
            fingerprint: lead.lead_code || lead.id,
            status: lead.status || "new",
            ownership_status: lead.ownership_status || "unowned",
            anti_circumvention_flag: lead.is_circumvention_flagged || lead.ownership_status === "protected",
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
            { label: "Accept", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "accept" }) },
            { label: "Reject", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "reject" }) },
            { label: "Reassign", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "request_reassignment", notes: "Partner requested reassignment" }) },
            { label: "Contact", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "log_contact_attempt", outcome: "call", notes: "Initial contact logged" }) },
            { label: "Callback", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "log_callback_booked", outcome: "call", notes: "Callback booked" }) },
            { label: "Viewing", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "log_viewing_booked", notes: "Viewing booked" }) },
            { label: "Complete", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "log_viewing_completed", notes: "Viewing completed" }) },
            { label: "Won", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "mark_won", notes: "Lead won" }) },
            { label: "Lost", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "mark_lost", notes: "Lead lost" }) },
            { label: "Invalid", variant: "ghost", onClick: () => assignmentMutation.mutate({ leadId: lead.id, assignmentId: lead.assignment_id, action: "mark_invalid", notes: "Lead marked invalid" }) }
          ];
        }}
      />
    </div>
  );
}