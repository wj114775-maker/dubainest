import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import AdminProjectProfileFormCard from "@/components/admin/AdminProjectProfileFormCard";
import ProjectProfileRegistryTableCard from "@/components/admin/ProjectProfileRegistryTableCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createEntitySafe, getBase44ErrorText, isEntitySchemaKnownMissing, updateEntitySafe } from "@/lib/base44Safeguards";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { listProjectProfiles } from "@/lib/projectProfiles";

export default function OpsProjects() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingProjectProfile, setEditingProjectProfile] = useState(null);

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
  const { data: projects = [] } = useQuery({
    queryKey: ["ops-projects-records"],
    queryFn: async () => {
      try {
        return await base44.entities.Project.list("-updated_date", 200);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const projectSchemaMissing = isEntitySchemaKnownMissing("ProjectProfile");
  const summary = [
    { label: "Projects", value: String(projectProfiles.length) },
    { label: "Published", value: String(projectProfiles.filter((profile) => profile.page_status === "published").length) },
    { label: "Homepage", value: String(projectProfiles.filter((profile) => profile.show_on_homepage).length) },
    { label: "Linked source", value: String(projectProfiles.filter((profile) => profile.project_id).length) },
  ];

  const saveProjectProfile = useMutation({
    mutationFn: async (form) => {
      const result = editingProjectProfile?.id
        ? await updateEntitySafe("ProjectProfile", editingProjectProfile.id, form)
        : await createEntitySafe("ProjectProfile", form);

      if (!result.ok && result.missingSchema) {
        throw new Error("SchemaMissing:ProjectProfile");
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
      queryClient.invalidateQueries({ queryKey: ["developer-project-profiles"] });
      toast({ title: "Project saved" });
    },
    onError: (error) => {
      const message = String(error?.message || "");
      toast({
        title: "Project save failed",
        description: message.startsWith("SchemaMissing:")
          ? "ProjectProfile is not published in the live Base44 app yet."
          : getBase44ErrorText(error) || "The project record could not be saved.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title="Projects"
        description="This is the project table. Add and edit project records here, then decide which ones should be public."
        action={<Button onClick={() => setEditingProjectProfile(null)}>New project</Button>}
      />
      <AccessGuard permission="settings.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>
      <AccessGuard permission="settings.read">
        {projectProfiles.length ? (
          <ProjectProfileRegistryTableCard profiles={projectProfiles} onEdit={setEditingProjectProfile} />
        ) : (
          <EmptyStateCard title="No projects yet" description="Add your first project when you are ready." />
        )}
      </AccessGuard>
      <AccessGuard permission="settings.manage">
        <AdminProjectProfileFormCard
          profile={editingProjectProfile}
          projects={projects}
          developerProfiles={developerProfiles}
          onSubmit={(form) => saveProjectProfile.mutate(form)}
          onCancel={() => setEditingProjectProfile(null)}
          disabled={projectSchemaMissing}
        />
      </AccessGuard>
    </div>
  );
}
