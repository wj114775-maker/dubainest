import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import WorkflowDialog from "@/components/common/WorkflowDialog";
import QueueCard from "@/components/common/QueueCard";
import ConciergeFilters from "@/components/concierge/ConciergeFilters";
import AdminSummaryStrip from "@/components/admin/AdminSummaryStrip";
import AccessGuard from "@/components/admin/AccessGuard";
import { Button } from "@/components/ui/button";
import { listEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, conciergeCaseTypeOptions, conciergePriorityOptions, isOpenCase, isOverdue, priorityRank } from "@/lib/concierge";

export default function OpsConcierge() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ search: "", status: "all", caseType: "all", priority: "all", owner: "all" });
  const [showPlanningPanels, setShowPlanningPanels] = useState(false);

  const { data: workspace = { cases: [], tasks: [], ndaRecords: [], inventoryRequests: [], viewingPlans: [], viewingStops: [], referrals: [] } } = useQuery({
    queryKey: ["ops-concierge-workspace"],
    queryFn: async () => {
      const [cases, tasks, ndaRecords, inventoryRequests, viewingPlans, viewingStops, referrals] = await Promise.all([
        listEntitySafe("ConciergeCase", "-updated_date", 200),
        listEntitySafe("ConciergeTask", "-updated_date", 400),
        listEntitySafe("NDATracking", "-updated_date", 200),
        listEntitySafe("PrivateInventoryRequest", "-updated_date", 200),
        listEntitySafe("ViewingPlan", "-updated_date", 200),
        listEntitySafe("ViewingStop", "-updated_date", 400),
        listEntitySafe("ServiceReferral", "-updated_date", 300)
      ]);
      return { cases, tasks, ndaRecords, inventoryRequests, viewingPlans, viewingStops, referrals };
    },
    initialData: { cases: [], tasks: [], ndaRecords: [], inventoryRequests: [], viewingPlans: [], viewingStops: [], referrals: [] }
  });

  const createCase = useMutation({
    mutationFn: (payload) => base44.functions.invoke("openConciergeCase", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-concierge-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["ops-dashboard-data"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
  });

  const reconcileSla = useMutation({
    mutationFn: () => base44.functions.invoke("reconcileConciergeSla", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-concierge-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-inbox"] });
    }
  });

  const searchValue = filters.search.trim().toLowerCase();
  const sortedCases = useMemo(() => [...workspace.cases].sort((left, right) => {
    const priorityDelta = priorityRank(right.priority) - priorityRank(left.priority);
    if (priorityDelta !== 0) return priorityDelta;
    return new Date(right.updated_date || right.created_date || 0).getTime() - new Date(left.updated_date || left.created_date || 0).getTime();
  }), [workspace.cases]);

  const filteredCases = useMemo(() => sortedCases.filter((item) => {
    const searchMatch = !searchValue || [
      item.case_code,
      item.summary,
      item.case_type,
      item.lead_id,
      item.buyer_user_id,
      item.assigned_concierge_id,
      item.primary_partner_id
    ].filter(Boolean).join(" ").toLowerCase().includes(searchValue);
    const statusMatch = filters.status === "all" || item.case_status === filters.status;
    const typeMatch = filters.caseType === "all" || item.case_type === filters.caseType;
    const priorityMatch = filters.priority === "all" || item.priority === filters.priority;
    const ownerMatch = filters.owner === "all" || item.assigned_concierge_id === filters.owner;
    return searchMatch && statusMatch && typeMatch && priorityMatch && ownerMatch;
  }), [sortedCases, searchValue, filters]);

  const filteredCaseIds = useMemo(() => new Set(filteredCases.map((item) => item.id)), [filteredCases]);
  const filteredTasks = useMemo(() => workspace.tasks.filter((item) => filteredCaseIds.has(item.case_id)), [workspace.tasks, filteredCaseIds]);
  const filteredViewingPlans = useMemo(() => workspace.viewingPlans.filter((item) => filteredCaseIds.has(item.case_id)), [workspace.viewingPlans, filteredCaseIds]);
  const filteredReferrals = useMemo(() => workspace.referrals.filter((item) => filteredCaseIds.has(item.case_id)), [workspace.referrals, filteredCaseIds]);

  const openTasks = filteredTasks.filter((item) => !["completed", "cancelled"].includes(item.status));
  const activeCases = filteredCases.filter(isOpenCase);
  const ndaPending = workspace.ndaRecords.filter((item) => filteredCaseIds.has(item.case_id) && ["pending", "sent"].includes(item.nda_status)).length;
  const openInventoryRequests = workspace.inventoryRequests.filter((item) => filteredCaseIds.has(item.case_id) && !["fulfilled", "rejected", "revoked"].includes(item.request_status)).length;
  const upcomingViewings = filteredViewingPlans.filter((item) => item.date_start && new Date(item.date_start) >= new Date() && !["completed", "cancelled"].includes(item.status)).length;
  const unresolvedReferrals = filteredReferrals.filter((item) => !["completed", "rejected", "cancelled"].includes(item.status)).length;
  const summary = [
    { label: "Active cases", value: String(activeCases.length) },
    { label: "Urgent HNW cases", value: String(activeCases.filter((item) => item.is_hnw && ["urgent", "vip"].includes(item.priority)).length) },
    { label: "NDA pending", value: String(ndaPending), hint: `${openInventoryRequests} private inventory requests open` },
    { label: "Overdue tasks", value: String(openTasks.filter((item) => isOverdue(item.due_date)).length), hint: `${upcomingViewings} viewing plans upcoming` },
    { label: "Upcoming viewings", value: String(upcomingViewings) },
    { label: "Service referrals", value: String(unresolvedReferrals) }
  ];

  const stopCountByPlan = useMemo(() => workspace.viewingStops.reduce((accumulator, item) => {
    accumulator[item.viewing_plan_id] = (accumulator[item.viewing_plan_id] || 0) + 1;
    return accumulator;
  }, {}), [workspace.viewingStops]);

  const caseItems = filteredCases.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.case_code,
    meta: [compactLabel(item.case_type), item.summary, item.assigned_concierge_id].filter(Boolean).join(" · "),
    status: item.case_status,
    badges: [
      item.priority,
      item.is_private_inventory ? "private_inventory" : null,
      item.is_hnw ? "hnw" : null,
      item.is_golden_visa_case ? "golden_visa" : null,
      item.sla_status === "breached" ? "sla_breached" : item.sla_status === "at_risk" ? "sla_at_risk" : null
    ].filter(Boolean),
    href: `/ops/concierge/${item.id}`
  }));

  const taskItems = openTasks
    .sort((left, right) => new Date(left.due_date || 0).getTime() - new Date(right.due_date || 0).getTime())
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: [item.case_id, item.assigned_to, item.due_date ? `Due ${new Date(item.due_date).toLocaleString()}` : null].filter(Boolean).join(" · "),
      status: item.status,
      badges: [item.priority, isOverdue(item.due_date) ? "overdue" : null].filter(Boolean),
      href: `/ops/concierge/${item.case_id}`
    }));

  const viewingItems = filteredViewingPlans
    .sort((left, right) => new Date(left.date_start || 0).getTime() - new Date(right.date_start || 0).getTime())
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: item.title,
      meta: [item.case_id, item.date_start ? new Date(item.date_start).toLocaleString() : null, stopCountByPlan[item.id] ? `${stopCountByPlan[item.id]} stops` : "No stops"].filter(Boolean).join(" · "),
      status: item.status,
      badges: [item.approved_by_client ? "client_approved" : "awaiting_client"].filter(Boolean),
      href: `/ops/concierge/${item.case_id}`
    }));

  const referralItems = filteredReferrals
    .filter((item) => !["completed", "rejected", "cancelled"].includes(item.status))
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: compactLabel(item.service_type),
      meta: [item.case_id, item.partner_id, item.referred_at ? new Date(item.referred_at).toLocaleDateString() : null].filter(Boolean).join(" · "),
      status: item.status,
      href: `/ops/concierge/${item.case_id}`
    }));

  const ownerOptions = useMemo(() => Array.from(new Set(workspace.cases.map((item) => item.assigned_concierge_id).filter(Boolean))).sort(), [workspace.cases]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Premium cases"
        title="Private client, concierge, and HNW case delivery"
        description="This page now keeps the active case desk and today’s tasks up front. Planning panels stay secondary until you need them."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => reconcileSla.mutate()} disabled={reconcileSla.isPending}>Reconcile SLA</Button>
            <WorkflowDialog
              title="Open concierge case"
              description="Create a premium case manually or from an existing lead when internal teams need to take direct control."
              actionLabel="Create case"
              loading={createCase.isPending}
              fields={[
                { key: "lead_id", label: "Lead id" },
                { key: "buyer_user_id", label: "Buyer user id" },
                { key: "case_type", label: "Case type", type: "select", options: conciergeCaseTypeOptions, required: true },
                { key: "priority", label: "Priority", type: "select", options: conciergePriorityOptions, required: true },
                { key: "service_tier", label: "Service tier", type: "select", options: ["standard", "premium", "private_client", "hnw"], required: true },
                { key: "summary", label: "Summary", type: "textarea", required: true },
                { key: "preferred_areas", label: "Preferred areas", placeholder: "Palm Jumeirah, Downtown Dubai" },
                { key: "property_objective", label: "Property objective" },
                { key: "buying_timeframe", label: "Buying timeframe" },
                { key: "budget_min", label: "Budget min", type: "number" },
                { key: "budget_max", label: "Budget max", type: "number" },
                { key: "primary_partner_id", label: "Primary partner id" },
                { key: "is_private_inventory", label: "Private inventory", type: "checkbox" },
                { key: "is_hnw", label: "HNW case", type: "checkbox" },
                { key: "is_family_office", label: "Family office case", type: "checkbox" },
                { key: "is_relocation_case", label: "Relocation case", type: "checkbox" },
                { key: "is_golden_visa_case", label: "Golden Visa case", type: "checkbox" },
                { key: "requires_nda", label: "NDA required", type: "checkbox" }
              ]}
              initialValues={{
                case_type: "concierge_standard",
                priority: "standard",
                service_tier: "standard"
              }}
              onSubmit={(form) => createCase.mutate({
                ...form,
                source: "internal",
                budget_min: Number(form.budget_min || 0),
                budget_max: Number(form.budget_max || 0),
                preferred_areas: String(form.preferred_areas || "").split(",").map((item) => item.trim()).filter(Boolean)
              })}
            >
              <Button>Open concierge case</Button>
            </WorkflowDialog>
            <Button variant="outline" onClick={() => setShowPlanningPanels((current) => !current)}>
              {showPlanningPanels ? "Hide planning panels" : "Show planning panels"}
            </Button>
          </div>
        )}
      />

      <AccessGuard permission="concierge_cases.read">
        <AdminSummaryStrip items={summary} />
      </AccessGuard>

      <AccessGuard permission="concierge_cases.read">
        <ConciergeFilters
          filters={filters}
          onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
          owners={ownerOptions}
        />
      </AccessGuard>

      <AccessGuard permission="concierge_cases.read">
        <div className="grid gap-6 xl:grid-cols-2">
          <QueueCard title="Case registry" items={caseItems} emptyMessage="No concierge cases yet." formatStatus={compactLabel} />
          <QueueCard title="Task board" items={taskItems} emptyMessage="No open concierge tasks." formatStatus={compactLabel} />
        </div>
      </AccessGuard>
      <AccessGuard permission="concierge_cases.read">
        {showPlanningPanels ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <QueueCard title="Viewing planner" items={viewingItems} emptyMessage="No itinerary plans yet." formatStatus={compactLabel} />
            <QueueCard title="Service referrals" items={referralItems} emptyMessage="No active service referrals." formatStatus={compactLabel} />
          </div>
        ) : null}
      </AccessGuard>
    </div>
  );
}
