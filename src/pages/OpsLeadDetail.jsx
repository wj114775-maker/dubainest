import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LeadRecordPanel from "@/components/leads/LeadRecordPanel";
import InternalLeadActionPanel from "@/components/leads/InternalLeadActionPanel";
import LeadNotesCard from "@/components/leads/LeadNotesCard";
import LeadTimelinePanel from "@/components/leads/LeadTimelinePanel";
import LeadRuleEvaluationPanel from "@/components/leads/LeadRuleEvaluationPanel";
import ProtectionReviewPanel from "@/components/leads/ProtectionReviewPanel";
import DuplicateReviewPanel from "@/components/leads/DuplicateReviewPanel";
import LeadComparisonReviewCard from "@/components/leads/LeadComparisonReviewCard";
import LeadResolutionSummaryCard from "@/components/leads/LeadResolutionSummaryCard";
import LeadEvidencePanel from "@/components/leads/LeadEvidencePanel";
import useAccessControl from "@/hooks/useAccessControl";

export default function OpsLeadDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: access } = useAccessControl();
  const [showFullRecord, setShowFullRecord] = useState(false);
  const manageLead = useMutation({
    mutationFn: ({ action, notes, partner_id, target_lead_id, severity, approval }) => base44.functions.invoke("internalManageLead", { lead_id: id, action, notes, partner_id, target_lead_id, severity, approval }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-lead-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-leads-registry"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  const { data } = useQuery({
    queryKey: ["ops-lead-detail", id],
    queryFn: async () => {
      const [lead, attributions, identities, assignments, events, attempts, viewings, windows, alerts, audits, partners, leads, evaluations] = await Promise.all([
        base44.entities.Lead.get(id),
        base44.entities.LeadAttribution.filter({ lead_id: id }),
        base44.entities.LeadIdentity.filter({ lead_id: id }),
        base44.entities.LeadAssignment.filter({ lead_id: id }),
        base44.entities.LeadEvent.filter({ lead_id: id }),
        base44.entities.LeadContactAttempt.filter({ lead_id: id }),
        base44.entities.Viewing.filter({ lead_id: id }),
        base44.entities.LeadProtectionWindow.filter({ lead_id: id }),
        base44.entities.CircumventionAlert.filter({ lead_id: id }),
        base44.entities.AuditLog.filter({ entity_id: id }),
        base44.entities.PartnerAgency.list("-updated_date", 100),
        base44.entities.Lead.list("-updated_date", 200),
        base44.entities.LeadRuleEvaluation.filter({ lead_id: id })
      ]);
      return { lead, attributions, identities, assignments, events, attempts, viewings, windows, alerts, audits, partners, leads, evaluations };
    },
    initialData: { lead: null, attributions: [], identities: [], assignments: [], events: [], attempts: [], viewings: [], windows: [], alerts: [], audits: [], partners: [], leads: [], evaluations: [] }
  });

  const overviewItems = [
    { label: "Status", value: data.lead?.status || "new" },
    { label: "Stage", value: data.lead?.current_stage || "new" },
    { label: "Ownership", value: data.lead?.ownership_status || "unowned" },
    { label: "Source", value: data.lead?.source || "organic" }
  ];

  const duplicateCandidates = data.leads
    .filter((item) => item.id !== id)
    .map((item) => {
      let confidence = 0;
      if (item.lead_code && item.lead_code === data.lead?.lead_code) confidence += 55;
      if (item.assigned_partner_id && item.assigned_partner_id === data.lead?.assigned_partner_id) confidence += 10;
      if (item.country && item.country === data.lead?.country) confidence += 10;
      if (item.status && item.status === data.lead?.status) confidence += 5;
      if (item.is_duplicate_candidate) confidence += 10;
      return {
        ...item,
        id: item.id,
        label: `${item.lead_code || item.id} · ${item.intent_type || item.source || "Lead"}`,
        summary: [item.country, item.assigned_partner_id, item.status].filter(Boolean).join(" · ") || "Candidate lead",
        confidence
      };
    })
    .filter((item) => item.confidence >= 20)
    .sort((a, b) => b.confidence - a.confidence);

  const timelineItems = [...data.events.map((item) => ({ id: `event-${item.id}`, label: item.event_type || "event", value: item.summary || "—" })), ...data.audits.map((item) => ({ id: `audit-${item.id}`, label: item.action || "audit", value: item.summary || "—" }))]
    .sort((a, b) => String(b.id).localeCompare(String(a.id)));

  const latestAssignment = data.assignments[0] || null;
  const latestAlert = data.alerts[0] || null;
  const latestWindow = data.windows[0] || null;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Buyer pipeline"
        title={data.lead?.lead_code || "Lead detail"}
        description="This page is now one vertical lead workspace. The live workflow stays visible first, while the raw record stays secondary."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild><Link to="/ops/leads">Back</Link></Button>
            <Button variant="outline" onClick={() => setShowFullRecord((current) => !current)}>
              {showFullRecord ? "Hide full record" : "Show full record"}
            </Button>
            <Button onClick={() => manageLead.mutate({ action: "lock" })}>Lock</Button>
            <Button variant="outline" onClick={() => manageLead.mutate({ action: "release" })}>Release</Button>
          </div>
        )}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <div className="space-y-4">
            <LeadRecordPanel title="Lead overview" items={overviewItems} />
            <LeadTimelinePanel title="Live timeline" items={timelineItems} />
            <LeadRecordPanel title="Assignments and routing" items={data.assignments.map((item) => ({ id: item.id, label: item.assignment_status || "pending", value: [item.partner_id, item.assignment_reason, item.sla_due_at].filter(Boolean).join(" · ") || "—" }))} />
            <LeadRuleEvaluationPanel items={data.evaluations.map((item) => ({ id: item.id, ruleLabel: item.rule_id || "Runtime rule", matched: item.matched, summary: [item.result_payload_json?.result, item.result_payload_json?.rule_type, item.result_payload_json?.matched_partner_id].filter(Boolean).join(" · ") || "Evaluation recorded", trigger: item.trigger_event || "runtime" }))} />
            <LeadRecordPanel title="Protection windows" items={data.windows.map((item) => ({ id: item.id, label: item.status || "active", value: [item.lock_reason, item.protected_until, item.override_reason].filter(Boolean).join(" · ") || "—" }))} />
            <DuplicateReviewPanel candidates={duplicateCandidates} />
            {duplicateCandidates[0] ? <LeadComparisonReviewCard currentLead={data.lead} selectedCandidate={duplicateCandidates[0]?.id} candidates={duplicateCandidates} /> : null}
            <LeadRecordPanel title="Alerts" items={data.alerts.map((item) => ({ id: item.id, label: item.alert_type || "alert", value: [item.severity, item.status, item.summary].filter(Boolean).join(" · ") || "—" }))} />
            <LeadEvidencePanel alerts={data.alerts} />

            {showFullRecord ? (
              <Card className="rounded-[2rem] border-white/10 bg-card/80">
                <CardHeader><CardTitle>Full record</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <LeadRecordPanel title="Attribution" items={data.attributions.map((item) => ({ id: item.id, label: item.utm_source || item.first_referrer || "Attribution", value: item.landing_page || "—" }))} />
                  <LeadRecordPanel title="Identity" items={data.identities.map((item) => ({ id: item.id, label: item.full_name || item.email_normalised || "Identity", value: [item.mobile_normalised, item.whatsapp_normalised, item.country].filter(Boolean).join(" · ") || "—" }))} />
                  <LeadRecordPanel title="Contact attempts" items={data.attempts.map((item) => ({ id: item.id, label: item.channel || "contact", value: [item.outcome, item.notes, item.attempt_at].filter(Boolean).join(" · ") || "—" }))} />
                  <LeadRecordPanel title="Viewings" items={data.viewings.map((item) => ({ id: item.id, label: item.status || "requested", value: [item.listing_id, item.scheduled_at].filter(Boolean).join(" · ") || "—" }))} />
                  <LeadRecordPanel title="Audit history" items={data.audits.map((item) => ({ id: item.id, label: item.action || "audit", value: item.summary || "—" }))} />
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
        <div className="space-y-6">
          <InternalLeadActionPanel
            lead={data.lead}
            partners={data.partners.filter((item) => item.status === "active").map((item) => ({ id: item.id, name: item.name, partner_trust_score: item.partner_trust_score, sla_response_minutes: item.sla_response_minutes }))}
            duplicates={duplicateCandidates}
            loading={manageLead.isPending}
            canManage={access.can("assignments.manage")}
            onSubmit={(payload) => manageLead.mutate(payload)}
          />
          <LeadResolutionSummaryCard lead={data.lead} latestAssignment={latestAssignment} latestAlert={latestAlert} latestWindow={latestWindow} />
          <ProtectionReviewPanel windows={data.windows} alerts={data.alerts} />
          <LeadNotesCard leadId={id} />
        </div>
      </div>
    </div>
  );
}
