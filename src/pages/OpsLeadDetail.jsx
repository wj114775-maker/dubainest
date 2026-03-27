import React from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LeadRecordPanel from "@/components/leads/LeadRecordPanel";
import InternalLeadActionPanel from "@/components/leads/InternalLeadActionPanel";
import LeadNotesCard from "@/components/leads/LeadNotesCard";
import LeadTimelinePanel from "@/components/leads/LeadTimelinePanel";
import LeadRuleEvaluationPanel from "@/components/leads/LeadRuleEvaluationPanel";
import ProtectionReviewPanel from "@/components/leads/ProtectionReviewPanel";
import DuplicateReviewPanel from "@/components/leads/DuplicateReviewPanel";
import LeadResolutionSummaryCard from "@/components/leads/LeadResolutionSummaryCard";
import LeadEvidencePanel from "@/components/leads/LeadEvidencePanel";
import useAccessControl from "@/hooks/useAccessControl";

export default function OpsLeadDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: access } = useAccessControl();
  const manageLead = useMutation({
    mutationFn: ({ action, notes, partner_id, target_lead_id, severity }) => base44.functions.invoke("internalManageLead", { lead_id: id, action, notes, partner_id, target_lead_id, severity }),
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
    .filter((item) => item.id !== id && (item.is_duplicate_candidate || item.lead_code === data.lead?.lead_code))
    .map((item) => ({
      id: item.id,
      label: `${item.lead_code || item.id} · ${item.intent_type || item.source || "Lead"}`,
      summary: [item.country, item.assigned_partner_id, item.status].filter(Boolean).join(" · ") || "Candidate lead",
      confidence: item.lead_code && item.lead_code === data.lead?.lead_code ? 95 : 72
    }));

  const timelineItems = [...data.events.map((item) => ({ id: `event-${item.id}`, label: item.event_type || "event", value: item.summary || "—" })), ...data.audits.map((item) => ({ id: `audit-${item.id}`, label: item.action || "audit", value: item.summary || "—" }))]
    .sort((a, b) => String(b.id).localeCompare(String(a.id)));

  const latestAssignment = data.assignments[0] || null;
  const latestAlert = data.alerts[0] || null;
  const latestWindow = data.windows[0] || null;

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Internal OS" title={data.lead?.lead_code || "Lead detail"} description="Review the full operating record across routing, protection, partner handling and audit trail." action={<div className="flex gap-2"><Button variant="outline" asChild><Link to="/ops/leads">Back</Link></Button><Button onClick={() => manageLead.mutate({ action: "lock" })}>Lock</Button><Button variant="outline" onClick={() => manageLead.mutate({ action: "release" })}>Release</Button></div>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
        <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-muted/70 p-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="attempts">Contact</TabsTrigger>
          <TabsTrigger value="viewings">Viewings</TabsTrigger>
          <TabsTrigger value="protection">Protection</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><LeadRecordPanel title="Lead overview" items={overviewItems} /></TabsContent>
        <TabsContent value="attribution"><LeadRecordPanel title="Attribution" items={data.attributions.map((item) => ({ id: item.id, label: item.utm_source || item.first_referrer || "Attribution", value: item.landing_page || "—" }))} /></TabsContent>
        <TabsContent value="identity"><LeadRecordPanel title="Identity" items={data.identities.map((item) => ({ id: item.id, label: item.full_name || item.email_normalised || "Identity", value: [item.mobile_normalised, item.whatsapp_normalised, item.country].filter(Boolean).join(" · ") || "—" }))} /></TabsContent>
        <TabsContent value="assignments"><LeadRecordPanel title="Assignments" items={data.assignments.map((item) => ({ id: item.id, label: item.assignment_status || "pending", value: [item.partner_id, item.assignment_reason, item.sla_due_at].filter(Boolean).join(" · ") || "—" }))} /></TabsContent>
        <TabsContent value="events"><LeadTimelinePanel title="Lead activity timeline" items={timelineItems} /></TabsContent>
        <TabsContent value="attempts"><LeadRecordPanel title="Contact attempts" items={data.attempts.map((item) => ({ id: item.id, label: item.channel || "contact", value: [item.outcome, item.notes, item.attempt_at].filter(Boolean).join(" · ") || "—" }))} /></TabsContent>
        <TabsContent value="viewings"><LeadRecordPanel title="Viewings" items={data.viewings.map((item) => ({ id: item.id, label: item.status || "requested", value: [item.listing_id, item.scheduled_at].filter(Boolean).join(" · ") || "—" }))} /></TabsContent>
        <TabsContent value="protection"><div className="space-y-4"><LeadRecordPanel title="Protection windows" items={data.windows.map((item) => ({ id: item.id, label: item.status || "active", value: [item.lock_reason, item.protected_until, item.override_reason].filter(Boolean).join(" · ") || "—" }))} /><DuplicateReviewPanel candidates={duplicateCandidates} /></div></TabsContent>
        <TabsContent value="alerts"><div className="space-y-4"><LeadRecordPanel title="Circumvention alerts" items={data.alerts.map((item) => ({ id: item.id, label: item.alert_type || "alert", value: [item.severity, item.status, item.summary].filter(Boolean).join(" · ") || "—" }))} /><LeadEvidencePanel alerts={data.alerts} /></div></TabsContent>
        <TabsContent value="rules"><LeadRuleEvaluationPanel items={data.evaluations.map((item) => ({ id: item.id, ruleLabel: item.rule_id || "Runtime rule", matched: item.matched, summary: [item.result_payload_json?.result, item.result_payload_json?.rule_type, item.result_payload_json?.matched_partner_id].filter(Boolean).join(" · ") || "Evaluation recorded", trigger: item.trigger_event || "runtime" }))} /></TabsContent>
        <TabsContent value="audit"><LeadRecordPanel title="Audit history" items={data.audits.map((item) => ({ id: item.id, label: item.action || "audit", value: item.summary || "—" }))} /></TabsContent>
        </Tabs>
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