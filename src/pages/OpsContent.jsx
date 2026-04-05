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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import { listDeveloperProfiles } from "@/lib/developerProfiles";

export default function OpsContent() {
  const queryClient = useQueryClient();
  const [editingGuide, setEditingGuide] = useState(null);
  const [editingDeveloperProfile, setEditingDeveloperProfile] = useState(null);
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

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Content OS" title="Public pages, developer profiles, and conversion content" description="Use this page manager to decide which developer pages can go live, which ones stay hidden, and what content appears on the public site." />
      <Tabs defaultValue="developers" className="space-y-6">
        <TabsList className="h-auto rounded-[1.2rem] bg-card/80 p-1">
          <TabsTrigger value="developers" className="rounded-[1rem] px-4 py-2">Developer pages</TabsTrigger>
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
