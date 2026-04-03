import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import AccessGuard from "@/components/admin/AccessGuard";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import DuplicateQueueCard from "@/components/leads/DuplicateQueueCard";
import BuyerCaseDeskDrawer from "@/components/leads/BuyerCaseDeskDrawer";
import LeadFilterBar from "@/components/leads/LeadFilterBar";
import LeadPipelineBoard from "@/components/leads/LeadPipelineBoard";
import InternalLeadTable from "@/components/leads/InternalLeadTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buyerPipelineStages, compactLabel, getBuyerPipelineNextAction, getBuyerPipelineStage, isClosedBuyerCase } from "@/lib/buyerPipeline";
import { roleGroups } from "@/lib/appShell";
import { formatCurrency, getEntitlementAmount } from "@/lib/revenue";

function byNewest(left, right) {
  return new Date(right.updated_date || right.created_date || right.trigger_date || 0).getTime() - new Date(left.updated_date || left.created_date || left.trigger_date || 0).getTime();
}

function groupBy(items, key) {
  return items.reduce((accumulator, item) => {
    const value = item[key];
    if (!value) return accumulator;
    accumulator[value] = accumulator[value] || [];
    accumulator[value].push(item);
    return accumulator;
  }, {});
}

export default function OpsLeads() {
  const [filters, setFilters] = useState({ search: "", stage: "all", ownership: "all", priority: "all", source: "all", duplicate: "all", sla: "all" });
  const [selectedCaseId, setSelectedCaseId] = useState("");

  const { data: workspace = { buyerCases: [], partnerOptions: [], conciergeUserOptions: [] } } = useQuery({
    queryKey: ["ops-leads-registry"],
    queryFn: async () => {
      const [leads, assignments, identities, viewings, conciergeCases, entitlements, listings, agencies, invoices, payouts, disputes, users, userRoleAssignments] = await Promise.all([
        base44.entities.Lead.list("-updated_date", 250),
        base44.entities.LeadAssignment.list("-updated_date", 300),
        base44.entities.LeadIdentity.list("-updated_date", 400),
        base44.entities.Viewing.list("-updated_date", 300),
        base44.entities.ConciergeCase.list("-updated_date", 200),
        base44.entities.RevenueEntitlement.list("-updated_date", 300),
        base44.entities.Listing.list("-updated_date", 300),
        base44.entities.PartnerAgency.list("-updated_date", 100),
        base44.entities.InvoiceRecord.list("-updated_date", 300),
        base44.entities.PayoutRecord.list("-updated_date", 300),
        base44.entities.RevenueDispute.list("-updated_date", 300),
        base44.entities.User.list(),
        base44.entities.UserRoleAssignment.list()
      ]);

      const assignmentByLead = new Map(assignments.sort(byNewest).map((item) => [item.lead_id, item]));
      const identitiesByLead = groupBy(identities, "lead_id");
      const viewingsByLead = groupBy(viewings, "lead_id");
      const conciergeByLead = groupBy(conciergeCases.sort(byNewest), "lead_id");
      const entitlementsByLead = groupBy(entitlements.sort(byNewest), "lead_id");
      const invoiceByEntitlement = groupBy(invoices.sort(byNewest), "entitlement_id");
      const payoutByEntitlement = groupBy(payouts.sort(byNewest), "entitlement_id");
      const disputesByEntitlement = groupBy(disputes.sort(byNewest), "entitlement_id");
      const disputesByLead = groupBy(disputes.sort(byNewest), "lead_id");
      const listingsById = new Map(listings.map((item) => [item.id, item]));
      const agenciesById = new Map(agencies.map((item) => [item.id, item]));
      const usersById = new Map(users.map((item) => [item.id, item]));
      const activeUserAssignments = userRoleAssignments.filter((item) => item.status === "active" && (!item.end_date || new Date(item.end_date) >= new Date()));
      const assignmentsByUser = groupBy(activeUserAssignments, "user_id");

      const partnerOptions = agencies
        .map((item) => ({
          id: item.id,
          label: item.name || item.slug || item.id
        }))
        .sort((left, right) => left.label.localeCompare(right.label));

      const conciergeUserOptions = users
        .filter((user) => {
          const userAssignments = assignmentsByUser[user.id] || [];
          const grantedCodes = userAssignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]);
          const hasConciergeScope = grantedCodes.some((code) => [
            "concierge_cases",
            "concierge_tasks",
            "concierge_documents",
            "private_inventory",
            "nda",
            "viewing_plans",
            "service_referrals",
            "hnw_cases"
          ].some((fragment) => String(code || "").includes(fragment)));
          return roleGroups.internal.includes(user.role || "") || hasConciergeScope;
        })
        .map((user) => ({
          id: user.id,
          label: user.full_name || user.email || user.id
        }))
        .sort((left, right) => left.label.localeCompare(right.label));

      const buyerCases = leads.map((lead) => {
        const assignment = assignmentByLead.get(lead.id) || null;
        const identity = (identitiesByLead[lead.id] || [])[0] || null;
        const leadViewings = (viewingsByLead[lead.id] || []).sort(byNewest);
        const conciergeCase = (conciergeByLead[lead.id] || []).find((item) => !["closed_won", "closed_lost", "archived"].includes(item.case_status)) || (conciergeByLead[lead.id] || [])[0] || null;
        const leadEntitlements = entitlementsByLead[lead.id] || [];
        const latestRevenue = leadEntitlements[0] || null;
        const latestInvoice = latestRevenue ? (invoiceByEntitlement[latestRevenue.id] || [])[0] || null : null;
        const latestPayout = latestRevenue ? (payoutByEntitlement[latestRevenue.id] || [])[0] || null : null;
        const latestDispute = latestRevenue
          ? ((disputesByEntitlement[latestRevenue.id] || [])[0] || (disputesByLead[lead.id] || [])[0] || null)
          : (disputesByLead[lead.id] || [])[0] || null;
        const relatedListings = Array.from(new Set(leadViewings.map((item) => item.listing_id).filter(Boolean)))
          .map((listingId) => listingsById.get(listingId))
          .filter(Boolean);
        const pipelineStage = getBuyerPipelineStage({ lead, assignment, conciergeCase, latestRevenue, viewings: leadViewings, relatedListings });
        const hasSupplyIssue = relatedListings.some((listing) => ["under_review", "verification_pending", "flagged", "frozen", "stale"].includes(listing.status) || ["stale", "expired"].includes(listing.freshness_status));
        const assignedPartnerId = assignment?.partner_id || lead.assigned_partner_id || "";
        const conciergeOwnerName = conciergeCase?.assigned_concierge_id ? (usersById.get(conciergeCase.assigned_concierge_id)?.full_name || usersById.get(conciergeCase.assigned_concierge_id)?.email || conciergeCase.assigned_concierge_id) : "";
        const internalOwnerName = assignment?.internal_owner_id ? (usersById.get(assignment.internal_owner_id)?.full_name || usersById.get(assignment.internal_owner_id)?.email || assignment.internal_owner_id) : "";
        const ownerId = assignedPartnerId || assignment?.internal_owner_id || conciergeCase?.assigned_concierge_id || null;
        const ownerLabel = assignment?.partner_id
          ? agenciesById.get(assignment.partner_id)?.name || assignment.partner_id
          : assignedPartnerId
            ? agenciesById.get(assignedPartnerId)?.name || assignedPartnerId
            : assignment?.internal_owner_id
              ? internalOwnerName
              : conciergeCase?.assigned_concierge_id
                ? conciergeOwnerName
                : "Unassigned";
        const liveSignal = latestRevenue
          ? `${compactLabel(latestRevenue.entitlement_status)} · ${formatCurrency(getEntitlementAmount(latestRevenue), latestRevenue.currency || "AED")}`
          : conciergeCase
            ? `${compactLabel(conciergeCase.case_status)} premium case`
            : leadViewings[0]
              ? `${leadViewings.length} viewing${leadViewings.length > 1 ? "s" : ""} linked`
              : hasSupplyIssue
                ? `${relatedListings.length} listing blockers`
                : assignment?.assignment_status
                  ? `${compactLabel(assignment.assignment_status)} handoff`
                  : "Awaiting first action";

        const caseRecord = {
          id: lead.id,
          lead,
          assignment,
          identity,
          conciergeCase,
          latestRevenue,
          latestInvoice,
          latestPayout,
          latestDispute,
          entitlements: leadEntitlements,
          viewings: leadViewings,
          relatedListings,
          pipeline_stage: pipelineStage,
          stageLabel: buyerPipelineStages.find((stage) => stage.id === pipelineStage)?.label || compactLabel(pipelineStage),
          identityName: identity?.full_name || identity?.email_normalised || lead.lead_code || lead.id,
          intentLabel: [lead.intent_type || lead.source || "Buyer inquiry", lead.country || "Unknown market"].filter(Boolean).join(" · "),
          ownerId,
          ownerLabel,
          partnerOwnerLabel: assignedPartnerId ? agenciesById.get(assignedPartnerId)?.name || assignedPartnerId : "Unassigned",
          conciergeOwnerLabel: conciergeOwnerName || "No premium owner",
          liveSignal,
          hasSupplyIssue
        };

        return {
          ...caseRecord,
          nextAction: getBuyerPipelineNextAction(caseRecord)
        };
      });

      return { buyerCases, partnerOptions, conciergeUserOptions };
    },
    initialData: { buyerCases: [], partnerOptions: [], conciergeUserOptions: [] }
  });
  const buyerCases = workspace.buyerCases;

  const filteredCases = useMemo(() => buyerCases.filter((item) => {
    const searchMatch = !filters.search || [
      item.identityName,
      item.intentLabel,
      item.lead.lead_code,
      item.lead.source,
      item.ownerLabel,
      item.conciergeCase?.case_code,
      item.latestRevenue?.notes
    ].filter(Boolean).join(" ").toLowerCase().includes(filters.search.toLowerCase());
    const stageMatch = filters.stage === "all" || item.pipeline_stage === filters.stage;
    const ownershipMatch = filters.ownership === "all" || item.lead.ownership_status === filters.ownership;
    const priorityMatch = filters.priority === "all" || item.lead.priority === filters.priority;
    const sourceMatch = filters.source === "all" || item.lead.source === filters.source;
    const duplicateMatch = filters.duplicate === "all" || String(Boolean(item.lead.is_duplicate_candidate)) === filters.duplicate;
    const slaMatch = filters.sla === "all"
      || item.assignment?.sla_status === filters.sla
      || (filters.sla === "overdue" && item.assignment?.sla_due_at && new Date(item.assignment.sla_due_at) < new Date());
    return searchMatch && stageMatch && ownershipMatch && priorityMatch && sourceMatch && duplicateMatch && slaMatch;
  }), [buyerCases, filters]);

  const stageCounts = useMemo(() => buyerPipelineStages.map((stage) => ({
    ...stage,
    count: filteredCases.filter((item) => item.pipeline_stage === stage.id).length
  })), [filteredCases]);

  const duplicateQueue = filteredCases
    .filter((item) => item.lead.is_duplicate_candidate)
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      title: `${item.lead.lead_code || item.id} · ${item.identityName}`,
      summary: `${item.intentLabel} · ${item.ownerLabel}`,
      confidence: item.lead.lead_code ? 86 : 72
    }));

  const registryRows = filteredCases.map((item) => ({
    id: item.id,
    title: `${item.identityName} · ${item.lead.lead_code || item.id}`,
    meta: `${item.intentLabel} · ${item.ownerLabel}`,
    status: item.lead.status || "new",
    ownership_status: item.lead.ownership_status || "unowned",
    badges: [
      item.stageLabel,
      item.lead.source,
      item.lead.is_private_inventory ? "Private inventory" : null,
      item.conciergeCase ? `Premium ${compactLabel(item.conciergeCase.case_status)}` : null,
      item.latestRevenue ? `Money ${compactLabel(item.latestRevenue.entitlement_status)}` : null,
      item.assignment?.sla_due_at && new Date(item.assignment.sla_due_at) < new Date() ? "SLA overdue" : item.assignment?.sla_status
    ].filter(Boolean)
  }));

  const openCases = filteredCases.filter((item) => !isClosedBuyerCase(item));
  const premiumCases = filteredCases.filter((item) => item.lead.is_private_inventory || item.lead.is_high_value || item.conciergeCase).length;
  const moneyLive = filteredCases.filter((item) => item.latestRevenue && !["paid", "reversed", "written_off", "rejected"].includes(item.latestRevenue.entitlement_status)).length;
  const needsAssignment = filteredCases.filter((item) => item.pipeline_stage === "capture" || item.pipeline_stage === "protect" && !item.assignment?.partner_id).length;
  const closedCases = filteredCases.filter(isClosedBuyerCase).length;
  const selectedCase = useMemo(() => buyerCases.find((item) => item.id === selectedCaseId) || null, [buyerCases, selectedCaseId]);

  useEffect(() => {
    if (selectedCaseId && !selectedCase) {
      setSelectedCaseId("");
    }
  }, [selectedCase, selectedCaseId]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Buyer pipeline"
        title="One board for buyer intake, protection, premium handling, and money"
        description="This view turns the lead registry into a workflow board. Each buyer card now carries its linked premium and commercial state so staff can work from stage to stage instead of jumping between modules."
      />
      <AccessGuard permission="leads.read">
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Open buyer cases" value={String(openCases.length)} hint="Cases still in progress" />
            <MetricCard label="Needs assignment" value={String(needsAssignment)} hint="Still needs an owner or handoff" />
            <MetricCard label="Premium or private" value={String(premiumCases)} hint="Private, HNW, or concierge-linked" />
            <MetricCard label="Money live" value={String(moneyLive)} hint="Commercial work is already active" />
            <MetricCard label="Closed" value={String(closedCases)} hint="Won, lost, merged, or blocked" />
          </div>

          <LeadFilterBar filters={filters} onChange={setFilters} />

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            {stageCounts.map((stage) => (
              <div key={stage.id} className="rounded-[1.6rem] border border-white/10 bg-card/70 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{stage.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{stage.count}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>
              </div>
            ))}
          </div>

          <DuplicateQueueCard items={duplicateQueue} />

          <Tabs defaultValue="board" className="space-y-4">
            <TabsList className="h-auto rounded-[1.3rem] bg-muted/70 p-1">
              <TabsTrigger value="board" className="rounded-[1rem] px-4 py-2">Pipeline board</TabsTrigger>
              <TabsTrigger value="registry" className="rounded-[1rem] px-4 py-2">Advanced registry</TabsTrigger>
            </TabsList>
            <TabsContent value="board" className="space-y-4">
              <LeadPipelineBoard items={filteredCases} onOpenCase={setSelectedCaseId} />
            </TabsContent>
            <TabsContent value="registry">
              <InternalLeadTable leads={registryRows} />
            </TabsContent>
          </Tabs>

          <BuyerCaseDeskDrawer
            item={selectedCase}
            open={Boolean(selectedCase)}
            onOpenChange={(open) => {
              if (!open) setSelectedCaseId("");
            }}
            partnerOptions={workspace.partnerOptions}
            conciergeUserOptions={workspace.conciergeUserOptions}
          />
        </div>
      </AccessGuard>
    </div>
  );
}
