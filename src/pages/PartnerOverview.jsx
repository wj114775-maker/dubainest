import React from "react";
import { useQuery } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import PartnerProfileCard from "@/components/partner/PartnerProfileCard";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { base44 } from "@/api/base44Client";

export default function PartnerOverview() {
  const { data } = useCurrentUserRole();
  const { data: dashboard } = useQuery({
    queryKey: ["partner-dashboard", data.user?.id],
    enabled: !!data.user?.id,
    queryFn: async () => {
      const [profiles, agencies, leads, assignments, listings, disputes] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: data.user.id }),
        base44.entities.PartnerAgency.list(),
        base44.entities.Lead.list("-updated_date", 200),
        base44.entities.LeadAssignment.list("-updated_date", 200),
        base44.entities.Listing.list("-updated_date", 200),
        base44.entities.Dispute.list("-updated_date", 200),
      ]);

      const profile = profiles[0] || { membership_type: "broker", status: "active" };
      const agency = agencies.find((item) => item.id === profile.partner_agency_id) || null;
      const partnerAssignments = assignments.filter((item) => item.partner_id === profile.partner_agency_id);
      const partnerLeadIds = new Set(partnerAssignments.map((item) => item.lead_id));
      const partnerLeads = leads.filter((lead) => lead.partner_agency_id === profile.partner_agency_id || lead.assigned_partner_id === profile.partner_agency_id || partnerLeadIds.has(lead.id));
      const activeListings = listings.filter((listing) => listing.partner_agency_id === profile.partner_agency_id && listing.status === "published");
      const openDisputes = disputes.filter((item) => item.partner_agency_id === profile.partner_agency_id && !["resolved", "dismissed", "closed"].includes(item.status));
      const acceptedAssignments = partnerAssignments.filter((item) => item.assignment_status === "accepted" && item.accepted_at && item.assigned_at);
      const medianResponseMinutes = acceptedAssignments.length
        ? Math.round(
            acceptedAssignments
              .map((item) => (new Date(item.accepted_at).getTime() - new Date(item.assigned_at).getTime()) / 60000)
              .sort((a, b) => a - b)[Math.floor(acceptedAssignments.length / 2)]
          )
        : 0;

      return {
        profile: {
          ...profile,
          assigned_to: profile.assigned_to || agency?.name || "Unassigned",
          internal_notes: profile.internal_notes || agency?.trade_license_number || "No partner notes yet.",
        },
        metrics: {
          openLeads: partnerLeads.filter((lead) => !["won", "lost", "merged", "blocked"].includes(lead.status)).length,
          medianResponseMinutes,
          activeListings: activeListings.length,
          disputes: openDisputes.length,
        },
      };
    },
    initialData: {
      profile: { membership_type: "broker", status: "active" },
      metrics: { openLeads: 0, medianResponseMinutes: 0, activeListings: 0, disputes: 0 },
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Partner OS" title="Execution workspace for licensed agencies" description="Partners operate lead response, listing readiness, deal progress and payouts inside controlled rules set by the platform." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Open leads" value={String(dashboard.metrics.openLeads)} />
        <MetricCard label="Median response" value={`${dashboard.metrics.medianResponseMinutes} min`} />
        <MetricCard label="Active listings" value={String(dashboard.metrics.activeListings)} />
        <MetricCard label="Disputes" value={String(dashboard.metrics.disputes)} />
      </div>
      <PartnerProfileCard profile={dashboard.profile} />
    </div>
  );
}