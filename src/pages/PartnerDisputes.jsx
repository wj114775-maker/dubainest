import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";

export default function PartnerDisputes() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Disputes" title="Ownership and payout disputes under formal workflow" description="This layer is reserved for evidence-backed escalation and internal resolution paths." />
      <EmptyStateCard title="Dispute centre ready" description="Open, review and resolution states can be managed here with supporting evidence and audit history." />
    </div>
  );
}