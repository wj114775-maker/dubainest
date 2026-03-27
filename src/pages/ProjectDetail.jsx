import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import { Button } from '@/components/ui/button';
import BuyerIntentSheet from '@/components/leads/BuyerIntentSheet';

export default function ProjectDetail() {
  const { slug } = useParams();
  const [open, setOpen] = useState(false);

  const { data: project } = useQuery({
    queryKey: ["project", slug],
    enabled: !!slug,
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ slug });
      return projects[0] || null;
    },
    initialData: null,
  });

  const trustScore = project?.trust_score || 0;
  const constructionValue = project?.status === 'completed' ? '100%' : project?.status === 'under_construction' ? 'In progress' : project?.status === 'launched' ? 'Launched' : 'Planned';
  const developerScore = project?.trust_score || 0;
  const priceFrom = project?.price_from ? `AED ${Number(project.price_from).toLocaleString()}` : 'On request';

  return (
    <>
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Project intelligence" title={project?.name || slug?.replace(/-/g, " ") || "Project"} description={`Status: ${project?.status || 'planned'}${project?.handover_date ? ` · Handover ${project.handover_date}` : ''}`} action={<Button onClick={() => setOpen(true)}>Request brochure</Button>} />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Project trust" value={`${trustScore}/100`} />
        <MetricCard label="Construction status" value={constructionValue} />
        <MetricCard label="Developer score" value={String(developerScore)} />
        <MetricCard label="Price from" value={priceFrom} />
      </div>
    </div>
    <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="project_enquiry" projectId={project?.id || ''} title="Project enquiry" />
    </>
  );
}