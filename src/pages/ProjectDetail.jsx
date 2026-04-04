import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import { Badge } from '@/components/ui/badge';
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

  const constructionValue = project?.status === 'completed' ? '100%' : project?.status === 'under_construction' ? 'In progress' : project?.status === 'launched' ? 'Launched' : 'Planned';
  const priceFrom = project?.price_from ? `AED ${Number(project.price_from).toLocaleString()}` : 'On request';
  const handoverValue = project?.handover_date || 'TBC';
  const statusValue = project?.status ? String(project.status).replace(/_/g, ' ') : 'Planned';

  return (
    <>
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Project overview" title={project?.name || slug?.replace(/-/g, " ") || "Project"} description={`Status: ${statusValue}${project?.handover_date ? ` · Handover ${project.handover_date}` : ''}`} action={<Button onClick={() => setOpen(true)}>Request brochure</Button>} />
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Status {statusValue}</Badge>
        <Badge variant="outline">Sales {project?.verification_status || 'available'}</Badge>
        <Badge variant="outline">Authority {project?.authority_status || 'available'}</Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Construction" value={constructionValue} />
        <MetricCard label="Handover" value={handoverValue} />
        <MetricCard label="Area" value={project?.area_name || 'Dubai'} />
        <MetricCard label="Price from" value={priceFrom} />
      </div>
    </div>
    <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="project_enquiry" projectId={project?.id || ''} title="Project enquiry" />
    </>
  );
}
