import React, { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import useAppConfig from "@/hooks/useAppConfig";

export default function OpsSettings() {
  const queryClient = useQueryClient();
  const { data: config } = useAppConfig();
  const [form, setForm] = useState(config);

  useEffect(() => setForm(config), [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const records = await base44.entities.AppConfig.list();
      if (records[0]?.id) {
        return base44.entities.AppConfig.update(records[0].id, form);
      }
      return base44.entities.AppConfig.create(form);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["app-config"] }),
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Settings" title="Editable app identity" description="The app name and core brand details are controlled here so they can be amended globally later." />
      <AccessGuard permission="settings.manage">
        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <Input value={form.app_name || ""} onChange={(e) => setForm({ ...form, app_name: e.target.value })} placeholder="App name" />
            <Input value={form.tagline || ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline" />
            <Input value={form.whatsapp_number || ""} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="WhatsApp number" />
            <Input value={form.support_email || ""} onChange={(e) => setForm({ ...form, support_email: e.target.value })} placeholder="Support email" />
            <div className="md:col-span-2"><Button onClick={() => saveMutation.mutate()}>Save branding</Button></div>
          </CardContent>
        </Card>
      </AccessGuard>
    </div>
  );
}