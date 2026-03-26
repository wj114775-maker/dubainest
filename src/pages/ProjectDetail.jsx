import React, { useState } from "react";
import { useParams } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import { Button } from '@/components/ui/button';
import BuyerIntentSheet from '@/components/leads/BuyerIntentSheet';

export default function ProjectDetail() {
  const { slug } = useParams();
  const [open, setOpen] = useState(false);
  return (
    <>
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Project intelligence" title={slug?.replace(/-/g, " ") || "Project"} description="Project pages connect developer trust, construction status and pricing movements into one view." actions={<Button onClick={() => setOpen(true)}>Request brochure</Button>} />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Project trust" value="90/100" />
        <MetricCard label="Construction status" value="68%" />
        <MetricCard label="Developer score" value="89" />
        <MetricCard label="Price from" value="AED 1.7M" />
      </div>
    </div>
    <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="project_enquiry" projectId={slug || ''} title="Project enquiry" />
    </>
  );
}