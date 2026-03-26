import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import GuideCard from "@/components/content/GuideCard";

const guides = [
  { id: "1", category: "area", title: "Dubai Hills buyer guide", excerpt: "Area page operating as both intelligence and lead capture." },
  { id: "2", category: "investor_guide", title: "Yield-led community selection", excerpt: "Investor education with embedded shortlist triggers." }
];

export default function OpsContent() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Content OS" title="Area pages, project pages and conversion content" description="Content is structured like an operating system, not a static blog." />
      <div className="grid gap-5 md:grid-cols-2">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div>
    </div>
  );
}