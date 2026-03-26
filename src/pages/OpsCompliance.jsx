import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import ComplianceQueue from "@/components/ops/ComplianceQueue";
import ComplianceCaseCard from "@/components/ops/ComplianceCaseCard";

const items = [
  { id: "1", summary: "Permit expired on Downtown Sky Suite", category: "permit", status: "open", severity: "high" },
  { id: "2", summary: "Duplicate detected across partner feeds", category: "duplicate", status: "investigating", severity: "medium" }
];

const cases = [
  { id: "1", summary: "Freeze listing publication pending permit evidence", category: "permit", status: "awaiting_evidence", assigned_reviewer_id: "compliance@nestdubai.com", freeze_active: true },
  { id: "2", summary: "Review partner duplication pattern before payout release", category: "duplicate", status: "under_review", assigned_reviewer_id: "ops@nestdubai.com", freeze_active: false }
];

export default function OpsCompliance() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Compliance" title="Verification, permit and publishing controls" description="Compliance teams control what can go live, what is flagged, and what needs evidence before partner execution continues." />
      <ComplianceQueue items={items} />
      <div className="grid gap-4 md:grid-cols-2">
        {cases.map((item) => <ComplianceCaseCard key={item.id} item={item} />)}
      </div>
    </div>
  );
}