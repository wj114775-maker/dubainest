import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import AccessGuard from "@/components/admin/AccessGuard";
import LeadFilterBar from "@/components/leads/LeadFilterBar";
import InternalLeadTable from "@/components/leads/InternalLeadTable";

export default function OpsLeads() {
  const [filters, setFilters] = useState({ search: "", stage: "all", ownership: "all", priority: "all" });
  const { data: leads = [] } = useQuery({
    queryKey: ["ops-leads-registry"],
    queryFn: async () => base44.entities.Lead.list("-updated_date", 200),
    initialData: []
  });

  const filtered = useMemo(() => leads.filter((lead) => {
    const searchMatch = !filters.search || [lead.lead_code, lead.source, lead.intent_type].join(" ").toLowerCase().includes(filters.search.toLowerCase());
    const stageMatch = filters.stage === "all" || lead.current_stage === filters.stage || lead.status === filters.stage;
    const ownershipMatch = filters.ownership === "all" || lead.ownership_status === filters.ownership;
    const priorityMatch = filters.priority === "all" || lead.priority === filters.priority;
    return searchMatch && stageMatch && ownershipMatch && priorityMatch;
  }).map((lead) => ({
    id: lead.id,
    title: `${lead.lead_code || lead.id} · ${lead.intent_type || lead.source || "Lead"}`,
    meta: `${lead.country || "Unknown market"} · ${lead.priority || "standard"} · ${lead.assigned_partner_id || "Unassigned"}`,
    status: lead.status || "new",
    ownership_status: lead.ownership_status || "unowned"
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