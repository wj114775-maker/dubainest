import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import ComplianceQueue from "@/components/ops/ComplianceQueue";
import ComplianceCaseCard from "@/components/ops/ComplianceCaseCard";
import ComplianceHealthSummary from "@/components/ops/ComplianceHealthSummary";
import ComplianceFilters from "@/components/ops/ComplianceFilters";
import ListingGovernanceQueue from "@/components/ops/ListingGovernanceQueue";
import AccessGuard from "@/components/admin/AccessGuard";
import AdminRecordFormCard from "@/components/admin/AdminRecordFormCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OpsCompliance() {
  const queryClient = useQueryClient();
  const [caseForm, setCaseForm] = useState({ summary: "", category: "permit", severity: "low", status: "open" });
  const [ruleForm, setRuleForm] = useState({ name: "", rule_type: "publishing_gate", status: "active", conditions: "{}", actions: "{}" });
  const [filters, setFilters] = useState({ severity: "all", trustBand: "all", freshness: "all", permit: "all", partner: "all", scope: "all" });

  const { data: cases = [] } = useQuery({
    queryKey: ["ops-compliance-cases"],
    queryFn: () => base44.entities.ComplianceCase.list(),
    initialData: []
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["ops-compliance-listings"],
    queryFn: () => base44.entities.Listing.list("-updated_date", 200),
    initialData: []
  });

  const filteredListings = listings.filter((item) => {
    const severityMatch = filters.severity === "all" || cases.some((entry) => entry.listing_id === item.id && entry.severity === filters.severity);
    const trustMatch = filters.trustBand === "all" || item.trust_band === filters.trustBand;
    const freshnessMatch = filters.freshness === "all" || item.freshness_status === filters.freshness;
    const permitMatch = filters.permit === "all" || (filters.permit === "verified" ? item.permit_verified : !item.permit_verified);
    const partnerMatch = filters.partner === "all" || (filters.partner === "assigned" ? !!item.partner_agency_id : !item.partner_agency_id);
    return severityMatch && trustMatch && freshnessMatch && permitMatch && partnerMatch;
  });

  const filteredCases = cases.filter((item) => {
    const listing = listings.find((entry) => entry.id === item.listing_id);
    const severityMatch = filters.severity === "all" || item.severity === filters.severity;
    const trustMatch = filters.trustBand === "all" || !listing || listing.trust_band === filters.trustBand;
    const freshnessMatch = filters.freshness === "all" || !listing || listing.freshness_status === filters.freshness;
    const permitMatch = filters.permit === "all" || !listing || (filters.permit === "verified" ? listing.permit_verified : !listing.permit_verified);
    const partnerMatch = filters.partner === "all" || !listing || (filters.partner === "assigned" ? !!listing.partner_agency_id : !listing.partner_agency_id);
    return severityMatch && trustMatch && freshnessMatch && permitMatch && partnerMatch;
  });

  const queueItems = filteredCases.map((item) => ({
    id: item.id,
    summary: item.summary,
    category: item.category,
    status: item.status,
    severity: item.severity
  }));

  const manageRecord = useMutation({
    mutationFn: ({ entityName, payload, summary }) => base44.functions.invoke("adminManageGovernanceRecord", { entityName, action: "create", payload, summary, scope: "compliance" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-cases"] });
      queryClient.invalidateQueries({ queryKey: ["ops-compliance-rules"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Compliance" title="Verification, permit and publishing controls" description="Compliance teams control what can go live, what is flagged, and what needs evidence before partner execution continues." />
      <AccessGuard permission="compliance_cases.read">
        <ComplianceFilters filters={filters} onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))} />
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        {filters.scope !== "listings" ? <ComplianceQueue items={queueItems} /> : null}
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        <ComplianceHealthSummary listings={listings} cases={cases} />
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        {filters.scope !== "cases" ? <ListingGovernanceQueue listings={filteredListings.filter((item) => ["flagged", "frozen", "stale", "verification_pending", "under_review"].includes(item.status)).slice(0, 8)} /> : null}
      </AccessGuard>
      <AccessGuard permission="compliance_cases.read">
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCases.map((item) => <ComplianceCaseCard key={item.id} item={item} />)}
        </div>
      </AccessGuard>
      <AccessGuard permission="compliance_cases.manage">
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminRecordFormCard
            title="Create compliance case"
            values={caseForm}
            onChange={(key, value) => setCaseForm((current) => ({ ...current, [key]: value }))}
            fields={[{ key: "summary", label: "Summary", multiline: true }, { key: "category", label: "Category" }, { key: "severity", label: "Severity" }, { key: "status", label: "Status" }]}
            onSubmit={() => manageRecord.mutate({ entityName: "ComplianceCase", payload: caseForm, summary: "Compliance case created" })}
            submitLabel="Create case"
          />
          <AdminRecordFormCard
            title="Create compliance rule"
            values={ruleForm}
            onChange={(key, value) => setRuleForm((current) => ({ ...current, [key]: value }))}
            fields={[{ key: "name", label: "Rule name" }, { key: "rule_type", label: "Rule type" }, { key: "status", label: "Status" }, { key: "conditions", label: "Conditions JSON", multiline: true }, { key: "actions", label: "Actions JSON", multiline: true }]}
            onSubmit={() => manageRecord.mutate({ entityName: "ComplianceRule", payload: { ...ruleForm, conditions: JSON.parse(ruleForm.conditions || "{}"), actions: JSON.parse(ruleForm.actions || "{}") }, summary: "Compliance rule created" })}
            submitLabel="Create rule"
          />
        </div>
      </AccessGuard>
    </div>
  );
}