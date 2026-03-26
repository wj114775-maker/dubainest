import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import LeadOwnershipTable from "@/components/ops/LeadOwnershipTable";

const leads = [
  { id: "1", summary: "Shortlist share · HNW buyer", fingerprint: "DXB-88312", status: "qualified", ownership_status: "locked", anti_circumvention_flag: true },
  { id: "2", summary: "Concierge request · relocation family", fingerprint: "DXB-88355", status: "new", ownership_status: "owned", anti_circumvention_flag: true }
];

export default function OpsDashboard() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Internal OS" title="Enterprise operating system for demand, trust and payout control" description="This workspace centralises revenue operations, partner performance, compliance risk and lead protection." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Protected leads" value="428" />
        <MetricCard label="Partner SLA at risk" value="7" />
        <MetricCard label="Dispute exposure" value="AED 284k" />
        <MetricCard label="Trust score median" value="86" />
      </div>
      <LeadOwnershipTable leads={leads} />
    </div>
  );
}