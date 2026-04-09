import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import AdminProjectProfileFormCard from "@/components/admin/AdminProjectProfileFormCard";
import OpsDeskNav from "@/components/ops/OpsDeskNav";
import OpsProjectEditorDialog from "@/components/ops/OpsProjectEditorDialog";
import ProjectProfileRegistryTableCard from "@/components/admin/ProjectProfileRegistryTableCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { createEntitySafe, getBase44ErrorText, updateEntitySafe } from "@/lib/base44Safeguards";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { listDeveloperOpsWorkspace } from "@/lib/developerLifecycle";
import { listProjectProfiles } from "@/lib/projectProfiles";
import { compactLabel, formatCurrency } from "@/lib/revenue";

const emptyWorkspace = {
  organisations: [],
  prospects: [],
  activities: [],
  agreements: [],
  deals: [],
  listingRevisions: [],
  projectRevisions: [],
  memberships: [],
  projects: [],
  listings: [],
  documents: [],
  disputes: [],
  entitlements: [],
  developerProfiles: [],
  projectProfiles: [],
  auditLog: [],
};

export default function OpsProjects({ desk = "registry" }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingProject, setEditingProject] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProjectProfile, setEditingProjectProfile] = useState(null);

  const { data: workspace = emptyWorkspace } = useQuery({
    queryKey: ["ops-projects-registry"],
    queryFn: () => listDeveloperOpsWorkspace(),
    initialData: emptyWorkspace,
  });
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["ops-projects-profiles"],
    queryFn: () => listProjectProfiles(),
    initialData: [],
  });
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["ops-projects-developers"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });

  const projectsWithCounts = useMemo(() => workspace.projects.map((project) => ({
    ...project,
    listingCount: workspace.listings.filter((listing) => listing.project_id === project.id).length,
    dealCount: workspace.deals.filter((deal) => deal.project_id === project.id).length,
    pendingRevisionCount: workspace.projectRevisions.filter((revision) => revision.project_id === project.id && ["submitted", "under_review"].includes(revision.review_status)).length,
  })), [workspace.deals, workspace.listings, workspace.projectRevisions, workspace.projects]);

  const registrySummary = [
    { label: "Projects", value: String(workspace.projects.length) },
    { label: "Orphan projects", value: String(workspace.projects.filter((project) => !project.developer_organisation_id && !project.developer_id).length) },
    { label: "Under review", value: String(workspace.projects.filter((project) => project.publication_status === "under_review" || project.request_review_status === "requested").length) },
    { label: "Linked listings", value: String(workspace.listings.filter((listing) => listing.project_id).length) },
  ];

  const publishingSummary = [
    { label: "Project pages", value: String(projectProfiles.length) },
    { label: "Published", value: String(projectProfiles.filter((profile) => profile.page_status === "published").length) },
    { label: "Homepage", value: String(projectProfiles.filter((profile) => profile.show_on_homepage).length) },
    { label: "Linked source", value: String(projectProfiles.filter((profile) => profile.project_id).length) },
  ];

  const deskItems = [
    {
      label: "Registry",
      path: "/ops/projects/registry",
      description: "Operational project table with developer ownership, listings, and deal linkage.",
      value: workspace.projects.length,
    },
    {
      label: "Publishing",
      path: "/ops/projects/publishing",
      description: "Public project page manager kept separate from operational truth.",
      value: projectProfiles.length,
    },
  ];

  const saveProject = useMutation({
    mutationFn: async (payload) => {
      const result = editingProject?.id
        ? await updateEntitySafe("Project", editingProject.id, payload)
        : await createEntitySafe("Project", payload);

      if (!result.ok) throw result.error || new Error("Project save failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-projects-registry"] });
      if (editingProject?.id) {
        queryClient.invalidateQueries({ queryKey: ["ops-project-workspace", editingProject.id] });
      }
      setEditingProject(null);
      setEditorOpen(false);
      toast({ title: "Project saved" });
    },
    onError: (error) => {
      toast({
        title: "Project save failed",
        description: getBase44ErrorText(error) || "The project record could not be saved.",
        variant: "destructive",
      });
    },
  });

  const saveProjectProfile = useMutation({
    mutationFn: async (form) => {
      const result = editingProjectProfile?.id
        ? await updateEntitySafe("ProjectProfile", editingProjectProfile.id, form)
        : await createEntitySafe("ProjectProfile", form);

      if (!result.ok) {
        throw result.error || new Error("Project page save failed");
      }
      return result.data;
    },
    onSuccess: () => {
      setEditingProjectProfile(null);
      queryClient.invalidateQueries({ queryKey: ["ops-projects-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["project-profiles-public"] });
      queryClient.invalidateQueries({ queryKey: ["project-profile"] });
      queryClient.invalidateQueries({ queryKey: ["home-project-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["projects-directory"] });
      toast({ title: "Project page saved" });
    },
    onError: (error) => {
      toast({
        title: "Project page save failed",
        description: getBase44ErrorText(error) || "The public project page record could not be saved.",
        variant: "destructive",
      });
    },
  });

  const openCreate = () => {
    setEditingProject(null);
    setEditorOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setEditorOpen(true);
  };

  const renderRegistryDesk = () => (
    <div className="space-y-6">
      <AccessGuard permission="settings.read">
        <AdminSummaryStrip items={registrySummary} />
      </AccessGuard>

      <AccessGuard permission="settings.read">
        {workspace.projects.length ? (
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Operational projects table</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Developer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Publication</TableHead>
                    <TableHead>Handover</TableHead>
                    <TableHead>Listings</TableHead>
                    <TableHead>Deals</TableHead>
                    <TableHead>Pending revisions</TableHead>
                    <TableHead>Price from</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectsWithCounts.map((project) => {
                    const organisation = workspace.organisations.find((item) => item.id === project.developer_organisation_id || item.id === project.developer_id);
                    return (
                      <TableRow key={project.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-xs text-muted-foreground">{project.slug || "No slug set yet"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{organisation ? (organisation.trading_name || organisation.legal_name) : "Unassigned"}</TableCell>
                        <TableCell><Badge variant="outline">{compactLabel(project.status)}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{compactLabel(project.publication_status || "draft")}</Badge></TableCell>
                        <TableCell>{project.handover_date || "—"}</TableCell>
                        <TableCell>{project.listingCount}</TableCell>
                        <TableCell>{project.dealCount}</TableCell>
                        <TableCell>{project.pendingRevisionCount}</TableCell>
                        <TableCell>{project.price_from ? formatCurrency(project.price_from) : "—"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(project)}>Edit</Button>
                            <Button asChild variant="ghost" size="sm">
                              <Link to={`/ops/projects/${project.id}`}>Detail</Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <EmptyStateCard title="No projects yet" description="Create your first operational project record when you are ready." />
        )}
      </AccessGuard>
    </div>
  );

  const renderPublishingDesk = () => (
    <div className="space-y-6">
      <AccessGuard permission="settings.read">
        <AdminSummaryStrip items={publishingSummary} />
      </AccessGuard>
      <AccessGuard permission="settings.read">
        {projectProfiles.length ? (
          <ProjectProfileRegistryTableCard profiles={projectProfiles} onEdit={setEditingProjectProfile} />
        ) : (
          <EmptyStateCard title="No public project pages yet" description="Create a ProjectProfile when you are ready to publish a project page." />
        )}
      </AccessGuard>
      <AccessGuard permission="settings.manage">
        <AdminProjectProfileFormCard
          profile={editingProjectProfile}
          projects={workspace.projects}
          developerProfiles={developerProfiles}
          onSubmit={(form) => saveProjectProfile.mutate(form)}
          onCancel={() => setEditingProjectProfile(null)}
          disabled={false}
        />
      </AccessGuard>
    </div>
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title="Projects"
        description="Run project operations from the registry first, then manage the separate public project pages from the publishing desk."
        action={desk === "registry" ? <Button onClick={openCreate}>Create project</Button> : <Button onClick={() => setEditingProjectProfile(null)}>New project page</Button>}
      />

      <OpsDeskNav items={deskItems} />

      {desk === "publishing" ? renderPublishingDesk() : renderRegistryDesk()}

      <OpsProjectEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
        organisations={workspace.organisations}
        loading={saveProject.isPending}
        onSubmit={(payload) => saveProject.mutate(payload)}
      />
    </div>
  );
}
