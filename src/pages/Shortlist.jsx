import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";

export default function Shortlist() {
  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Saved" title="Shortlists stay anonymous until you share or request access" description="This is designed for mobile-first saving, later sharing, and controlled sign-up only when trust has been earned." />
      <EmptyStateCard title="Your shortlist is ready for enterprise actions" description="Saving, sharing and private inventory unlocks can all be connected to lead attribution and immutable event history." />
    </div>
  );
}