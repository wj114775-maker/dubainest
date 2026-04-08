import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AccessGuard from "@/components/admin/AccessGuard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import AdminDeveloperProfileFormCard from "@/components/admin/AdminDeveloperProfileFormCard";
import DeveloperProfileRegistryTableCard from "@/components/admin/DeveloperProfileRegistryTableCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import {
  createEntitySafe,
  getBase44ErrorText,
  getMissingEntitySchemas,
  isEntitySchemaKnownMissing,
  updateEntitySafe,
} from "@/lib/base44Safeguards";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { listProjectProfiles } from "@/lib/projectProfiles";
import {
  buildDemoDeveloperProfileTemplate,
  buildDemoProjectProfileTemplate,
  DEMO_DEVELOPER_SLUG,
  DEMO_PROJECT_SLUG,
} from "@/lib/contentTemplates";

export default function DeveloperPublicPublishingTab() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingDeveloperProfile, setEditingDeveloperProfile] = useState(null);
  const { data: approvedDevelopers = [] } = useApprovedDevelopers();
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["ops-developers-profiles"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["ops-developers-project-profiles"],
    queryFn: () => listProjectProfiles(),
    initialData: [],
  });

  const starterDeveloper = developerProfiles.find((profile) => profile.slug === DEMO_DEVELOPER_SLUG) || null;
  const starterProject = projectProfiles.find((profile) => profile.slug === DEMO_PROJECT_SLUG) || null;
  const missingSchemas = getMissingEntitySchemas(["DeveloperProfile", "ProjectProfile"]);
  const developerSchemaMissing = isEntitySchemaKnownMissing("DeveloperProfile");

  const summary = [
    { label: "Profiles", value: String(developerProfiles.length) },
    { label: "Partnered", value: String(developerProfiles.filter((profile) => profile.partnership_status === "partnered").length) },
    { label: "Published", value: String(developerProfiles.filter((profile) => profile.page_status === "published").length) },
    { label: "Homepage", value: String(developerProfiles.filter((profile) => profile.show_on_homepage).length) },
  ];

  const saveDeveloperProfile = useMutation({
    mutationFn: async (form) => {
      const result = editingDeveloperProfile?.id
        ? await updateEntitySafe("DeveloperProfile", editingDeveloperProfile.id, form)
        : await createEntitySafe("DeveloperProfile", form);

      if (!result.ok && result.missingSchema) {
        throw new Error("SchemaMissing:DeveloperProfile");
      }

      return result.data;
    },
    onSuccess: () => {
      setEditingDeveloperProfile(null);
      queryClient.invalidateQueries({ queryKey: ["ops-developers-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["developer-profiles-public"] });
      queryClient.invalidateQueries({ queryKey: ["developer-profile"] });
      queryClient.invalidateQueries({ queryKey: ["home-developer-profiles"] });
      toast({ title: "Developer profile saved" });
    },
    onError: (error) => {
      const message = String(error?.message || "");
      toast({
        title: "Developer profile save failed",
        description: message.startsWith("SchemaMissing:")
          ? "DeveloperProfile is not published in the live Base44 app yet."
          : getBase44ErrorText(error) || "The developer profile could not be saved.",
        variant: "destructive",
      });
    },
  });

  const createStarterSet = useMutation({
    mutationFn: async () => {
      let developerRecord = starterDeveloper;
      if (!developerRecord) {
        const developerResult = await createEntitySafe(
          "DeveloperProfile",
          buildDemoDeveloperProfileTemplate(approvedDevelopers)
        );
        if (!developerResult.ok && developerResult.missingSchema) {
          throw new Error("SchemaMissing:DeveloperProfile");
        }
        developerRecord = developerResult.data;
      }

      if (!starterProject) {
        const projectResult = await createEntitySafe("ProjectProfile", {
          ...buildDemoProjectProfileTemplate(),
          developer_profile_slug: developerRecord.slug || DEMO_DEVELOPER_SLUG,
          developer_name: developerRecord.developer_name || "Meraas",
        });

        if (!projectResult.ok && projectResult.missingSchema) {
          throw new Error("SchemaMissing:ProjectProfile");
        }
      }

      return developerRecord;
    },
    onSuccess: (developerRecord) => {
      queryClient.invalidateQueries({ queryKey: ["ops-developers-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["developer-profiles-public"] });
      queryClient.invalidateQueries({ queryKey: ["developer-profile"] });
      queryClient.invalidateQueries({ queryKey: ["home-developer-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["ops-developers-project-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["ops-projects-profiles"] });
      setEditingDeveloperProfile(developerRecord);
      toast({
        title: "Starter set created",
        description: "The demo developer and linked demo project are ready to review.",
      });
    },
    onError: () => {
      toast({
        title: "Starter set failed",
        description: missingSchemas.length
          ? `Missing live schemas: ${missingSchemas.join(", ")}.`
          : "The starter records could not be created.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <AccessGuard permission="settings.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>

      {missingSchemas.length ? (
        <Card className="rounded-[2rem] border-amber-300/60 bg-amber-50">
          <CardContent className="space-y-2 p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-700">Publish required</p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Public developer publishing needs live Base44 schemas</h2>
            <p className="text-sm leading-6 text-slate-700">Missing live schemas: {missingSchemas.join(", ")}.</p>
          </CardContent>
        </Card>
      ) : null}

      <AccessGuard permission="settings.manage">
        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs uppercase tracking-[0.28em] text-primary">Public publishing starter</p>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Create a clean developer and project publishing starter</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                This keeps the public content layer separate from the operational developer registry, while still giving the team a polished starter record to publish.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => createStarterSet.mutate()}
                disabled={createStarterSet.isPending || developerSchemaMissing || (Boolean(starterDeveloper) && Boolean(starterProject))}
              >
                {starterDeveloper && starterProject ? "Starter set already created" : createStarterSet.isPending ? "Creating..." : "Create starter set"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </AccessGuard>

      <AccessGuard permission="settings.read">
        {developerProfiles.length ? (
          <DeveloperProfileRegistryTableCard profiles={developerProfiles} onEdit={setEditingDeveloperProfile} />
        ) : (
          <EmptyStateCard title="No public developer profiles yet" description="Add your first public developer profile when you are ready." />
        )}
      </AccessGuard>

      <AccessGuard permission="settings.manage">
        <AdminDeveloperProfileFormCard
          profile={editingDeveloperProfile}
          approvedDevelopers={approvedDevelopers}
          onSubmit={(form) => saveDeveloperProfile.mutate(form)}
          onCancel={() => setEditingDeveloperProfile(null)}
          disabled={developerSchemaMissing}
        />
      </AccessGuard>
    </div>
  );
}
