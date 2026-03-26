import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import ComplianceQueue from "@/components/ops/ComplianceQueue";

const items = [
  { id: "1", summary: "Permit expired on Downtown Sky Suite", category: "permit", status: "open", severity: "high" },
  { id: "2", summary: "Duplicate detected across partner feeds", category: "duplicate", status: "investigating", severity: "medium" }
];

export default function OpsCompliance() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Compliance" title="Verification, permit and publishing controls" description="Compliance teams control what can go live, what is flagged, and what needs evidence before partner execution continues." />
      <ComplianceQueue items={items} />
    </div>
  );
}