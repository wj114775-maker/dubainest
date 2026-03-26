import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";

export default function Compare() {
  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Compare" title="Compare trust, yield, price and fit before you register" description="Compare sets are part of the anonymous browse layer, with registration triggered only when the user takes a protected action." />
      <EmptyStateCard title="Compare set is waiting" description="Once listings are added, this view can become a premium decision board with trust, permit and project status overlays." />
    </div>
  );
}