import React from "react";
import MetricCard from "@/components/common/MetricCard";

export default function AdminMetricGrid({ metrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard key={metric.label} label={metric.label} value={metric.value} />
      ))}
    </div>
  );
}