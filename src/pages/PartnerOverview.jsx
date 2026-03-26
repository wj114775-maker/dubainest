import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";

export default function PartnerOverview() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Partner OS" title="Execution workspace for licensed agencies" description="Partners operate lead response, listing readiness, deal progress and payouts inside controlled rules set by the platform." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Open leads" value="38" />
        <MetricCard label="Median response" value="12 min" />
        <MetricCard label="Active listings" value="114" />
        <MetricCard label="Disputes" value="3" />
      </div>
    </div>
  );
}