import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import GuideCard from "@/components/content/GuideCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import AdminGuideFormCard from "@/components/admin/AdminGuideFormCard";
import GuideRegistryTableCard from "@/components/admin/GuideRegistryTableCard";

export default function OpsContent() {
  const queryClient = useQueryClient();
  const [editingGuide, setEditingGuide] = useState(null);
  const { data: guides = [] } = useQuery({
    queryKey: ["ops-content-guides"],
    queryFn: () => base44.entities.Guide.list(),
    initialData: []
  });

  const saveGuide = useMutation({
    mutationFn: (form) => editingGuide?.id ? base44.entities.Guide.update(editingGuide.id, form) : base44.entities.Guide.create(form),
    onSuccess: () => {
      setEditingGuide(null);
      queryClient.invalidateQueries({ queryKey: ["ops-content-guides"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Content OS" title="Area pages, project pages and conversion content" description="Content is structured like an operating system, not a static blog." />
      <AccessGuard permission="settings.read">
        {guides.length ? <div className="grid gap-5 md:grid-cols-2">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div> : <EmptyStateCard title="No content guides yet" description="Published guides will appear here once they are created." />}
      </AccessGuard>
      <AccessGuard permission="settings.manage">
        <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <GuideRegistryTableCard guides={guides} onEdit={setEditingGuide} />
          <AdminGuideFormCard guide={editingGuide} onSubmit={(form) => saveGuide.mutate(form)} onCancel={() => setEditingGuide(null)} />
        </div>
      </AccessGuard>
    </div>
  );
}