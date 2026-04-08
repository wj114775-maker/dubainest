import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import DeveloperProjectEditorDialog from "@/components/developer/DeveloperProjectEditorDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import useDeveloperPortalWorkspace from "@/hooks/useDeveloperPortalWorkspace";
import { createEntitySafe, updateEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, formatCurrency } from "@/lib/revenue";

export default function DeveloperProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: workspace, current } = useDeveloperPortalWorkspace();
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);

  const pendingRevisionCounts = useMemo(() => workspace.projectRevisions.reduce((acc, revision) => {
    if (!revision.project_id) return acc;
    acc[revision.project_id] = (acc[revision.project_id] || 0) + 1;
    return acc;
  }, {}), [workspace.projectRevisions]);

  const saveProject = useMutation({
    mutationFn: async (payload) => {
      const result = activeProject?.id
        ? await updateEntitySafe("Project", activeProject.id, payload)
        : await createEntitySafe("Project", {
          ...payload,
          developer_organisation_id: workspace.organisation.id,
          developer_id: workspace.organisation.id,
        });

      if (!result.ok) {
        throw result.error || new Error("Project save failed");
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      setActiveProject(null);
      setEditorOpen(false);
      toast({ title: "Project saved" });
    },
    onError: () => {
      toast({ title: "Project save failed", variant: "destructive" });
    },
  });

  const requestReview = useMutation({
    mutationFn: async (project) => {
      const result = await createEntitySafe("DeveloperProjectRevision", {
        developer_organisation_id: workspace.organisation.id,
        project_id: project.id,
        requested_by_user_id: current?.user?.id,
        change_type: project.publication_status === "published" ? "live_update" : "publication_request",
        review_status: "submitted",
        name: project.name,
        slug: project.slug,
        status: project.status,
        handover_date: project.handover_date,
        price_from: project.price_from,
        brochure_url: project.brochure_url,
        floor_plan_url: project.floor_plan_url,
        amenities: project.amenities || [],
        payment_plan_summary: project.payment_plan_summary,
        submitted_at: new Date().toISOString(),
      });
      if (!result.ok) {
        throw result.error || new Error("Project review request failed");
      }
      await updateEntitySafe("Project", project.id, { request_review_status: "requested", publication_status: "under_review" });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      toast({ title: "Project review requested" });
    },
    onError: () => {
      toast({ title: "Project review request failed", variant: "destructive" });
    },
  });

  if (!workspace.organisation) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Developer portal" title="Projects" description="Project access is available after a developer organisation has been linked to your account." />
        <EmptyStateCard title="No developer organisation linked" description="Ask the internal team to complete your portal setup first." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Developer portal"
        title="Projects"
        description="Create and maintain operational project records here. Public project pages stay in a separate governed publishing layer."
        action={<Button onClick={() => { setActiveProject(null); setEditorOpen(true); }} disabled={!workspace.capabilities.canEditProjects}>Create project</Button>}
      />
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Operational project registry</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {workspace.projects.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Publication</TableHead>
                  <TableHead>Handover</TableHead>
                  <TableHead>Price from</TableHead>
                  <TableHead>Pending reviews</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.slug || "No slug set yet"}</p>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(project.status)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(project.publication_status || "draft")}</Badge></TableCell>
                    <TableCell>{project.handover_date || "—"}</TableCell>
                    <TableCell>{project.price_from ? formatCurrency(project.price_from) : "—"}</TableCell>
                    <TableCell>{pendingRevisionCounts[project.id] || 0}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setActiveProject(project); setEditorOpen(true); }} disabled={!workspace.capabilities.canEditProjects}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => requestReview.mutate(project)} disabled={requestReview.isPending || !workspace.capabilities.canEditProjects}>
                          Request review
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyStateCard title="No projects yet" description="Create your first project to start linking listings and documents." />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Review queue</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {workspace.projectRevisions.length ? workspace.projectRevisions.map((revision) => (
            <div key={revision.id} className="rounded-2xl border border-white/10 p-4">
              <p className="font-medium">{revision.name || revision.project_id || "Project revision"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{[compactLabel(revision.change_type), compactLabel(revision.review_status), revision.submitted_at ? new Date(revision.submitted_at).toLocaleString() : null].filter(Boolean).join(" · ")}</p>
            </div>
          )) : <p className="text-sm text-muted-foreground">No review requests have been submitted yet.</p>}
        </CardContent>
      </Card>

      <DeveloperProjectEditorDialog
        open={editorOpen}
        onOpenChange={(value) => { setEditorOpen(value); if (!value) setActiveProject(null); }}
        project={activeProject}
        loading={saveProject.isPending}
        onSubmit={(payload) => saveProject.mutate(payload)}
      />
    </div>
  );
}
