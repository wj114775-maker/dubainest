import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";

export default function GoldenVisa() {
  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Golden Visa" title="Eligibility workflow for property-led residency" description="A premium flow to qualify, route and open concierge support only when the buyer chooses to proceed." />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Qualification path" value="Property" />
        <MetricCard label="Workflow stage" value="Assessment" />
        <MetricCard label="Concierge trigger" value="Ready" />
      </div>
    </div>
  );
}