import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import AdminGuideFormCard from "@/components/admin/AdminGuideFormCard";
import GuideRegistryTableCard from "@/components/admin/GuideRegistryTableCard";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import GuideCard from "@/components/content/GuideCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OpsContent() {
  const queryClient = useQueryClient();
  const [editingGuide, setEditingGuide] = useState(null);
  const { data: guides = [] } = useQuery({
    queryKey: ["ops-content-guides"],
    queryFn: () => base44.entities.Guide.list(),
    initialData: []
  });

  const summary = [
    { label: "Guides", value: String(guides.length) },
    { label: "Published", value: String(guides.filter((guide) => guide.status === "published").length) },
    { label: "Draft", value: String(guides.filter((guide) => guide.status !== "published").length) },
  ];

  const saveGuide = useMutation({
    mutationFn: (form) => editingGuide?.id
      ? base44.entities.Guide.update(editingGuide.id, form)
      : base44.entities.Guide.create(form),
    onSuccess: () => {
      setEditingGuide(null);
      queryClient.invalidateQueries({ queryKey: ["ops-content-guides"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title="Guides"
        description="This page only manages buyer guides and public advisory content. Developers, projects, and listings now live in their own dedicated tables."
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.28em] text-primary">Need another table?</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Use the dedicated pages for your core records instead of managing them here.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/ops/developers">Open developers</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ops/projects">Open projects</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/ops/listings">Open listings</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <AccessGuard permission="settings.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>

      <AccessGuard permission="settings.read">
        {guides.length ? (
          <div className="grid gap-5 md:grid-cols-2">
            {guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
          </div>
        ) : (
          <EmptyStateCard title="No guides yet" description="Add your first guide when you are ready." />
        )}
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
