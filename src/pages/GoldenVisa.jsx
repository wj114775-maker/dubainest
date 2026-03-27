import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";

export default function GoldenVisa() {
  const { data } = useQuery({
    queryKey: ["golden-visa-metrics"],
    queryFn: async () => {
      const [leads, guides, conciergeCases] = await Promise.all([
        base44.entities.Lead.list("-updated_date", 200),
        base44.entities.Guide.list("-updated_date", 200),
        base44.entities.ConciergeCase.list("-updated_date", 200),
      ]);

      const visaLeads = leads.filter((lead) => lead.golden_visa_interest || lead.intent_type === "golden_visa" || lead.source === "guide");
      const publishedVisaGuides = guides.filter((guide) => guide.category === "golden_visa" && guide.status === "published").length;
      const openConcierge = conciergeCases.filter((item) => !["closed", "resolved", "completed"].includes(item.status)).length;

      return {
        qualificationPath: visaLeads.length ? "Property" : "Not started",
        workflowStage: visaLeads.some((lead) => ["qualified", "assigned", "accepted"].includes(lead.status)) ? "In progress" : "Assessment",
        conciergeTrigger: openConcierge ? "Active" : "Ready",
        publishedVisaGuides,
      };
    },
    initialData: {
      qualificationPath: "Not started",
      workflowStage: "Assessment",
      conciergeTrigger: "Ready",
      publishedVisaGuides: 0,
    },
  });

  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Golden Visa" title="Eligibility workflow for property-led residency" description="A premium flow to qualify, route and open concierge support only when the buyer chooses to proceed." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Qualification path" value={data.qualificationPath} />
        <MetricCard label="Workflow stage" value={data.workflowStage} />
        <MetricCard label="Concierge trigger" value={data.conciergeTrigger} />
        <MetricCard label="Published visa guides" value={String(data.publishedVisaGuides)} />
      </div>
    </div>
  );
}