import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import GuideCard from "@/components/content/GuideCard";

const fallbackGuides = [
  { id: "1", category: "investing", title: "Buying off-plan with proper controls", excerpt: "Use project status, developer trust and permit signals together." },
  { id: "2", category: "golden_visa", title: "Golden Visa workflow", excerpt: "When qualification starts and which triggers should open a concierge case." },
  { id: "3", category: "relocation", title: "Family relocation to Dubai", excerpt: "A planning guide for housing, banking and schooling." }
];

export default function Guides() {
  const { data: guides = fallbackGuides } = useQuery({ queryKey: ["guides"], queryFn: () => base44.entities.Guide.list(), initialData: fallbackGuides });
  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Guides" title="Content engineered for trust and conversion" description="Area intelligence, investor education and relocation planning form a lead capture layer, not just a marketing blog." />
      <div className="grid gap-5 md:grid-cols-3">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div>
    </div>
  );
}