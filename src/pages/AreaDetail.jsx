import React from "react";
import { useParams } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";

export default function AreaDetail() {
  const { slug } = useParams();
  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Area intelligence" title={slug?.replace(/-/g, " ") || "Dubai area"} description="Area pages combine pricing context, lifestyle fit and investor demand into a controlled acquisition surface." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Demand score" value="87" />
        <MetricCard label="Median price" value="AED 2.9M" />
        <MetricCard label="Average yield" value="6.8%" />
        <MetricCard label="Family fit" value="81/100" />
      </div>
    </div>
  );
}