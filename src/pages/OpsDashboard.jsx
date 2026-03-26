import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import LeadOwnershipTable from "@/components/ops/LeadOwnershipTable";
import AdminMetricGrid from "@/components/admin/AdminMetricGrid";
import AccessGuard from "@/components/admin/AccessGuard";

export default function OpsDashboard() {
  const { data } = useQuery({
    queryKey: ["ops-dashboard-data"],
    queryFn: async () => {
      const [leads, complianceCases, payouts, listings] = await Promise.all([
        base44.entities.Lead.list(),
        base44.entities.ComplianceCase.list(),
        base44.entities.Payout.list(),
        base44.entities.Listing.list()
      ]);

      return { leads, complianceCases, payouts, listings };
    },
    initialData: { leads: [], complianceCases: [], payouts: [], listings: [] }
  });

  const protectedLeads = data.leads.filter((lead) => ["locked", "owned"].includes(lead.ownership_status)).length;
  const partnerSlaAtRisk = data.complianceCases.filter((item) => ["open", "triage", "under_review", "awaiting_evidence"].includes(item.status)).length;
  const disputeExposure = data.payouts
    .filter((item) => item.status === "disputed")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const trustMedian = data.listings.length
    ? Math.round(data.listings.reduce((sum, item) => sum + Number(item.trust_score || 0), 0) / data.listings.length)
    : 0;

  const metrics = [
    { label: "Protected leads", value: String(protectedLeads) },
    { label: "Partner SLA at risk", value: String(partnerSlaAtRisk) },
    { label: "Dispute exposure", value: `AED ${disputeExposure.toLocaleString()}` },
    { label: "Trust score median", value: String(trustMedian) }
  ];

  const leadRows = data.leads.slice(0, 8).map((lead) => ({
    id: lead.id,
    summary: `${lead.source || "Lead"} · ${lead.priority || "standard"}`,
    fingerprint: lead.fingerprint || "—",
    status: lead.status || "new",
    ownership_status: lead.ownership_status || "unclaimed",
    anti_circumvention_flag: ["protected", "frozen", "disputed"].includes(lead.protection_status)
  }));

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Internal OS" title="Enterprise operating system for demand, trust and payout control" description="This workspace centralises revenue operations, partner performance, compliance risk and lead protection." />
      <AccessGuard permission="audit.read">
        <AdminMetricGrid metrics={metrics} />
      </AccessGuard>
      <AccessGuard permission="leads.read">
        <LeadOwnershipTable leads={leadRows} />
      </AccessGuard>
    </div>
  );
}