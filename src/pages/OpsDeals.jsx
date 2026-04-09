import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import SectionHeading from "@/components/common/SectionHeading";
import DeveloperDealsTab from "@/components/ops/DeveloperDealsTab";
import { useToast } from "@/components/ui/use-toast";
import { buildDeveloperDealWorkflowPayload, listDeveloperOpsWorkspace } from "@/lib/developerLifecycle";
import { updateEntitySafe } from "@/lib/base44Safeguards";

const emptyWorkspace = {
  organisations: [],
  deals: [],
  projects: [],
  listings: [],
};

export default function OpsDeals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: workspace = emptyWorkspace } = useQuery({
    queryKey: ["ops-deals-registry"],
    queryFn: () => listDeveloperOpsWorkspace(),
    initialData: emptyWorkspace,
  });

  const progressDeal = useMutation({
    mutationFn: async ({ deal, action }) => {
      const result = await updateEntitySafe("DeveloperDeal", deal.id, buildDeveloperDealWorkflowPayload(action, new Date().toISOString()));
      if (!result.ok) throw result.error || new Error("Developer deal update failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-deals-registry"] });
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({ title: "Deal updated" });
    },
    onError: () => toast({ title: "Deal update failed", variant: "destructive" }),
  });

  const summary = [
    { label: "Deals", value: String(workspace.deals.length) },
    { label: "Reservation pending", value: String(workspace.deals.filter((item) => item.stage === "reservation_pending").length) },
    { label: "Payment milestones", value: String(workspace.deals.filter((item) => item.stage === "payment_milestones").length) },
    { label: "Handover pending", value: String(workspace.deals.filter((item) => item.stage === "handover_pending").length) },
  ];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title="Deals"
        description="Use the dedicated deals desk for reservation, SPA, payment, handover, and commercial follow-up across all signed developers."
      />

      <AccessGuard permission="settings.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>

      <DeveloperDealsTab
        deals={workspace.deals}
        organisations={workspace.organisations}
        projects={workspace.projects}
        listings={workspace.listings}
        loading={progressDeal.isPending}
        onAction={(deal, action) => progressDeal.mutate({ deal, action })}
        detailBasePath="/ops/deals"
      />
    </div>
  );
}
