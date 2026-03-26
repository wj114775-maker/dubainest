import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import GuideCard from "@/components/content/GuideCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";

export default function OpsContent() {
  const { data: guides = [] } = useQuery({
    queryKey: ["ops-content-guides"],
    queryFn: () => base44.entities.Guide.list(),
    initialData: []
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Content OS" title="Area pages, project pages and conversion content" description="Content is structured like an operating system, not a static blog." />
      <AccessGuard permission="settings.read">
        {guides.length ? <div className="grid gap-5 md:grid-cols-2">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div> : <EmptyStateCard title="No content guides yet" description="Published guides will appear here once they are created." />}
      </AccessGuard>
    </div>
  );
}