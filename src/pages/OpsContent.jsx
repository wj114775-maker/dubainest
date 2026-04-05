import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import GuideCard from "@/components/content/GuideCard";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import AdminGuideFormCard from "@/components/admin/AdminGuideFormCard";
import GuideRegistryTableCard from "@/components/admin/GuideRegistryTableCard";
import AdminDeveloperProfileFormCard from "@/components/admin/AdminDeveloperProfileFormCard";
import DeveloperProfileRegistryTableCard from "@/components/admin/DeveloperProfileRegistryTableCard";
import AdminProjectProfileFormCard from "@/components/admin/AdminProjectProfileFormCard";
import ProjectProfileRegistryTableCard from "@/components/admin/ProjectProfileRegistryTableCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { listProjectProfiles } from "@/lib/projectProfiles";
import {
  buildDemoDeveloperProfileTemplate,
  buildDemoProjectProfileTemplate,
  DEMO_DEVELOPER_SLUG,
  DEMO_PROJECT_SLUG,
} from "@/lib/contentTemplates";

export default function OpsContent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingGuide, setEditingGuide] = useState(null);
  const [editingDeveloperProfile, setEditingDeveloperProfile] = useState(null);
  const [editingProjectProfile, setEditingProjectProfile] = useState(null);
  const { data: approvedDevelopers = [] } = useApprovedDevelopers();
  const { data: guides = [] } = useQuery({
    queryKey: ["ops-content-guides"],
    queryFn: () => base44.entities.Guide.list(),
    initialData: []
  });
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["ops-content-developer-profiles"],
    queryFn: () => listDeveloperProfiles(),
    initialData: []
  });
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["ops-content-project-profiles"],
    queryFn: () => listProjectProfiles(),
    initialData: []
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["ops-content-project-records"],
    queryFn: async () => {
      try {
        return await base44.entities.Project.list("-updated_date", 200);
      } catch {
        return [];
      }
    },
    initialData: []
  });

  const saveGuide = useMutation({
    mutationFn: (form) => editingGuide?.id ? base44.entities.Guide.update(editingGuide.id, form) : base44.entities.Guide.create(form),
    onSuccess: () => {
      setEditingGuide(null);
      queryClient.invalidateQueries({ queryKey: ["ops-content-guides"] });
    }
  });
  const saveDeveloperProfile = useMutation({
    mutationFn: (form) => editingDeveloperProfile?.id
      ? base44.entities.DeveloperProfile.update(editingDeveloperProfile.id, form)
      : base44.entities.DeveloperProfile.create(form),
    onSuccess: () => {
      setEditingDeveloperProfile(null);
      queryClient.invalidateQueries({ queryKey: ["ops-content-developer-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["developer-profiles-public"] });
      queryClient.invalidateQueries({ queryKey: ["developer-profile"] });
      queryClient.invalidateQueries({ queryKey: ["home-developer-profiles"] });
    }
  });
  const saveProjectProfile = useMutation({
    mutationFn: (form) => editingProjectProfile?.id
      ? base44.entities.ProjectProfile.update(editingProjectProfile.id, form)
      : base44.entities.ProjectProfile.create(form),
    onSuccess: () => {
      setEditingProjectProfile(null);
      queryClient.invalidateQueries({ queryKey: ["ops-content-project-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["project-profiles-public"] });
      queryClient.invalidateQueries({ queryKey: ["project-profile"] });
      queryClient.invalidateQueries({ queryKey: ["home-project-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["projects-directory"] });
      queryClient.invalidateQueries({ queryKey: ["developer-project-profiles"] });
    }
  });
  const starterDeveloper = developerProfiles.find((profile) => profile.slug === DEMO_DEVELOPER_SLUG) || null;
  const starterProject = projectProfiles.find((profile) => profile.slug === DEMO_PROJECT_SLUG) || null;
  const createStarterSet = useMutation({
    mutationFn: async () => {
      let developerRecord = starterDeveloper;
      if (!developerRecord) {
        developerRecord = await base44.entities.DeveloperProfile.create(
          buildDemoDeveloperProfileTemplate(approvedDevelopers)
        );
      }

      let projectRecord = starterProject;
      if (!projectRecord) {
        projectRecord = await base44.entities.ProjectProfile.create({
          ...buildDemoProjectProfileTemplate(),
          developer_profile_slug: developerRecord.slug || DEMO_DEVELOPER_SLUG,
          developer_name: developerRecord.developer_name || "Meraas",
        });
      }

      return { developerRecord, projectRecord };
    },
    onSuccess: ({ developerRecord, projectRecord }) => {
      queryClient.invalidateQueries({ queryKey: ["ops-content-developer-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["ops-content-project-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["developer-profiles-public"] });
      queryClient.invalidateQueries({ queryKey: ["developer-profile"] });
      queryClient.invalidateQueries({ queryKey: ["home-developer-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["project-profiles-public"] });
      queryClient.invalidateQueries({ queryKey: ["project-profile"] });
      queryClient.invalidateQueries({ queryKey: ["home-project-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["projects-directory"] });
      queryClient.invalidateQueries({ queryKey: ["developer-project-profiles"] });
      setEditingDeveloperProfile(developerRecord);
      setEditingProjectProfile(projectRecord);
      toast({
        title: "Starter set created",
        description: "A partnered developer page and linked project page are ready to review in the editors.",
      });
    },
    onError: () => {
      toast({
        title: "Starter set failed",
        description: "The demo developer/project records could not be created. Check that the new Base44 entities are published first.",
        variant: "destructive",
      });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Content OS" title="Public pages, developer profiles, and conversion content" description="Use this page manager to decide which developer pages can go live, which ones stay hidden, and what content appears on the public site." />
      <AccessGuard permission="settings.manage">
        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Quick-start starter set</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create one polished developer page and one linked project page</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                This creates a governed Meraas developer profile and a linked City Walk Crestlane project page using the current sale-only demo stock. It is the fastest way to populate the enterprise developer → project → listing hierarchy after Base44 publish.
              </p>
              <p className="text-xs text-muted-foreground">
                Status: developer {starterDeveloper ? "ready" : "not created"} · project {starterProject ? "ready" : "not created"}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => createStarterSet.mutate()}
                disabled={createStarterSet.isPending || Boolean(starterDeveloper && starterProject)}
              >
                {starterDeveloper && starterProject ? "Starter set already created" : createStarterSet.isPending ? "Creating starter set..." : "Create starter set"}
              </Button>
              {starterDeveloper ? (
                <Button variant="outline" onClick={() => setEditingDeveloperProfile(starterDeveloper)}>
                  Open developer editor
                </Button>
              ) : null}
              {starterProject ? (
                <Button variant="outline" onClick={() => setEditingProjectProfile(starterProject)}>
                  Open project editor
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </AccessGuard>
      <Tabs defaultValue="developers" className="space-y-6">
        <TabsList className="h-auto rounded-[1.2rem] bg-card/80 p-1">
          <TabsTrigger value="developers" className="rounded-[1rem] px-4 py-2">Developer pages</TabsTrigger>
          <TabsTrigger value="projects" className="rounded-[1rem] px-4 py-2">Project pages</TabsTrigger>
          <TabsTrigger value="guides" className="rounded-[1rem] px-4 py-2">Guides</TabsTrigger>
        </TabsList>

        <TabsContent value="developers" className="space-y-6">
          <AccessGuard permission="settings.read">
            {developerProfiles.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {developerProfiles.slice(0, 4).map((profile) => (
                  <Card key={profile.id} className="rounded-[2rem] border-white/10 bg-card/80">
                    <CardContent className="space-y-3 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-primary">Developer page</p>
                      <h3 className="text-xl font-semibold tracking-tight">{profile.developer_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {String(profile.partnership_status || "not_partnered").replace(/_/g, " ")} · {String(profile.page_status || "draft").replace(/_/g, " ")}
                        {profile.show_on_homepage ? " · homepage" : ""}
                      </p>
                      <div className="rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground line-clamp-4">
                        {profile.summary || "No public summary added yet."}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyStateCard title="No developer pages yet" description="Create a standard profile page only for developers you actively partner with and want to expose publicly." />
            )}
          </AccessGuard>
          <AccessGuard permission="settings.manage">
            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <DeveloperProfileRegistryTableCard profiles={developerProfiles} onEdit={setEditingDeveloperProfile} />
              <AdminDeveloperProfileFormCard
                profile={editingDeveloperProfile}
                approvedDevelopers={approvedDevelopers}
                onSubmit={(form) => saveDeveloperProfile.mutate(form)}
                onCancel={() => setEditingDeveloperProfile(null)}
              />
            </div>
          </AccessGuard>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <AccessGuard permission="settings.read">
            {projectProfiles.length ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {projectProfiles.slice(0, 4).map((profile) => (
                  <Card key={profile.id} className="rounded-[2rem] border-white/10 bg-card/80">
                    <CardContent className="space-y-3 p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-primary">Project page</p>
                      <h3 className="text-xl font-semibold tracking-tight">{profile.project_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {String(profile.page_status || "draft").replace(/_/g, " ")}
                        {profile.show_on_homepage ? " · homepage" : ""}
                        {profile.developer_name ? ` · ${profile.developer_name}` : ""}
                      </p>
                      <div className="rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground line-clamp-4">
                        {profile.summary || "No public summary added yet."}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyStateCard title="No project pages yet" description="Create governed project pages for launches, off-plan opportunities, and flagship supply you want to rank publicly." />
            )}
          </AccessGuard>
          <AccessGuard permission="settings.manage">
            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <ProjectProfileRegistryTableCard profiles={projectProfiles} onEdit={setEditingProjectProfile} />
              <AdminProjectProfileFormCard
                profile={editingProjectProfile}
                projects={projects}
                developerProfiles={developerProfiles}
                onSubmit={(form) => saveProjectProfile.mutate(form)}
                onCancel={() => setEditingProjectProfile(null)}
              />
            </div>
          </AccessGuard>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <AccessGuard permission="settings.read">
            {guides.length ? <div className="grid gap-5 md:grid-cols-2">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div> : <EmptyStateCard title="No content guides yet" description="Published guides will appear here once they are created." />}
          </AccessGuard>
          <AccessGuard permission="settings.manage">
            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <GuideRegistryTableCard guides={guides} onEdit={setEditingGuide} />
              <AdminGuideFormCard guide={editingGuide} onSubmit={(form) => saveGuide.mutate(form)} onCancel={() => setEditingGuide(null)} />
            </div>
          </AccessGuard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
