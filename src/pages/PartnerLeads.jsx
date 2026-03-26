import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import LeadOwnershipTable from "@/components/ops/LeadOwnershipTable";

const leads = [
  { id: "1", summary: "Private inventory request · Palm buyer", fingerprint: "DXB-LEAD-4481", status: "assigned", ownership_status: "locked", anti_circumvention_flag: true },
  { id: "2", summary: "Callback request · Marina investor", fingerprint: "DXB-LEAD-4402", status: "contacted", ownership_status: "owned", anti_circumvention_flag: true }
];

export default function PartnerLeads() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Lead inbox" title="Protected lead handling for partner teams" description="Every protected action can become an attributable lead with lock logic, anti-circumvention checks and immutable history." />
      <LeadOwnershipTable leads={leads} />
    </div>
  );
}