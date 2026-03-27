import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import LeadFilterBar from "@/components/leads/LeadFilterBar";
import InternalLeadTable from "@/components/leads/InternalLeadTable";

export default function OpsLeads() {
  const [filters, setFilters] = useState({ search: "", stage: "all", ownership: "all", priority: "all", source: "all", duplicate: "all", sla: "all" });
  const { data: leads = [] } = useQuery({
    queryKey: ["ops-leads-registry"],
    queryFn: async () => {
      const [leadsData, assignments] = await Promise.all([
        base44.entities.Lead.list("-updated_date", 200),
        base44.entities.LeadAssignment.list("-updated_date", 200)
      ]);
      return leadsData.map((lead) => {
        const assignment = assignments.find((item) => item.lead_id === lead.id);
        return { ...lead, sla_due_at: assignment?.sla_due_at, sla_status: assignment?.sla_status };
      });
    },
    initialData: []
  });

  const filtered = useMemo(() => leads.filter((lead) => {
    const searchMatch = !filters.search || [lead.lead_code, lead.source, lead.intent_type, lead.assigned_partner_id].join(" ").toLowerCase().includes(filters.search.toLowerCase());
    const stageMatch = filters.stage === "all" || lead.current_stage === filters.stage || lead.status === filters.stage;
    const ownershipMatch = filters.ownership === "all" || lead.ownership_status === filters.ownership;
    const priorityMatch = filters.priority === "all" || lead.priority === filters.priority;
    const sourceMatch = filters.source === "all" || lead.source === filters.source;
    const duplicateMatch = filters.duplicate === "all" || String(Boolean(lead.is_duplicate_candidate)) === filters.duplicate;
    const slaMatch = filters.sla === "all" || lead.sla_status === filters.sla || (filters.sla === "overdue" && lead.sla_due_at && new Date(lead.sla_due_at) < new Date());
    return searchMatch && stageMatch && ownershipMatch && priorityMatch && sourceMatch && duplicateMatch && slaMatch;
  }).map((lead) => ({
    id: lead.id,
    title: `${lead.lead_code || lead.id} · ${lead.intent_type || lead.source || "Lead"}`,
    meta: `${lead.country || "Unknown market"} · ${lead.priority || "standard"} · ${lead.assigned_partner_id || "Unassigned"}`,
    status: lead.status || "new",
    ownership_status: lead.ownership_status || "unowned",
    badges: [lead.source, lead.is_private_inventory ? "Private inventory" : null, lead.is_high_value ? "High value" : null, lead.is_duplicate_candidate ? "Duplicate" : null, lead.sla_due_at && new Date(lead.sla_due_at) < new Date() ? "SLA overdue" : lead.sla_status].filter(Boolean)
  })), [leads, filters]);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Internal OS" title="Lead operations workspace" description="Search, review and operate the active lead registry with ownership and conversion context." />
      <AccessGuard permission="leads.read">
        <div className="space-y-6">
          <LeadFilterBar filters={filters} onChange={setFilters} />
          <InternalLeadTable leads={filtered} />
        </div>
      </AccessGuard>
    </div>
  );
}