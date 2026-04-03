import React from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ListingPublicationActions from "@/components/ops/ListingPublicationActions";
import SectionHeading from "@/components/common/SectionHeading";
import ListingEvidenceReviewPanel from "@/components/ops/ListingEvidenceReviewPanel";
import ListingDuplicateReviewPanel from "@/components/ops/ListingDuplicateReviewPanel";

function DataListCard({ title, items = [], render }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map(render) : <p className="text-sm text-muted-foreground">No records yet.</p>}
      </CardContent>
    </Card>
  );
}

export default function OpsListingDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["ops-listing-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const listing = await base44.entities.Listing.get(id);
      const [verification, permits, authority, cases, evidence, decisions, audit, allListings, duplicateReviewRecords] = await Promise.all([
        base44.entities.ListingVerification.filter({ listing_id: id }),
        base44.entities.ListingPermit.filter({ listing_id: id }),
        base44.entities.ListingAuthorityRecord.filter({ listing_id: id }),
        base44.entities.ComplianceCase.filter({ listing_id: id }),
        base44.entities.ComplianceEvidence.filter({ listing_id: id }),
        base44.entities.ListingPublicationDecision.filter({ listing_id: id }),
        base44.entities.AuditLog.filter({ entity_id: id }),
        base44.entities.Listing.list("-updated_date", 200),
        base44.entities.ListingDuplicateReview.list("-updated_date", 500)
      ]);
      const duplicateReviews = duplicateReviewRecords.filter((item) => item.listing_id === id || item.matched_listing_id === id);
      const relatedListingIds = Array.from(new Set([id, ...duplicateReviews.flatMap((item) => [item.listing_id, item.matched_listing_id, item.primary_listing_id]).filter(Boolean)]));
      const relatedListings = allListings
        .filter((item) => relatedListingIds.includes(item.id))
        .reduce((accumulator, item) => ({ ...accumulator, [item.id]: item }), {});
      return { listing, verification, permits, authority, cases, evidence, decisions, audit, duplicateReviews, relatedListings };
    },
    initialData: null
  });

  const evaluateMutation = useMutation({
    mutationFn: () => base44.functions.invoke("evaluateListingGovernance", { listing_id: id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ops-listing-detail", id] })
  });

  const decisionMutation = useMutation({
    mutationFn: async ({ decisionType, reason }) => {
      const response = await base44.functions.invoke("internalManageListingPublication", {
        listing_id: id,
        decision_type: decisionType,
        reason
      });
      await base44.functions.invoke("evaluateListingGovernance", { listing_id: id });
      return response?.listing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-listing-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-listings"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  const evidenceReviewMutation = useMutation({
    mutationFn: async ({ evidenceId, decision, reason }) => {
      const response = await base44.functions.invoke("internalReviewListingEvidence", {
        evidence_id: evidenceId,
        decision,
        reason
      });
      await base44.functions.invoke("evaluateListingGovernance", { listing_id: id });
      return response?.evidence;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-listing-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-listings"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  const duplicateReviewMutation = useMutation({
    mutationFn: async ({ reviewId, decision, reason, matchedListingId }) => {
      await base44.functions.invoke("internalReviewListingDuplicate", {
        listing_id: id,
        review_id: reviewId,
        decision,
        reason,
        matched_listing_id: matchedListingId
      });
      await base44.functions.invoke("evaluateListingGovernance", { listing_id: id });
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-listing-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-listings"] });
      queryClient.invalidateQueries({ queryKey: ["ops-audit-feed"] });
    }
  });

  if (isLoading || !data?.listing) {
    return <div className="text-sm text-muted-foreground">Loading listing workspace...</div>;
  }

  const { listing, verification, permits, authority, cases, evidence, decisions, audit, duplicateReviews, relatedListings } = data;

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Supply review detail" title={listing.title} description="Review verification, trust, freshness, authority, evidence, and publication history from one place." />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="flex flex-wrap items-center gap-3 p-5">
          <Badge variant="outline">{listing.status}</Badge>
          <Badge variant="outline">Trust {listing.trust_band || 'low'}</Badge>
          <Badge variant="outline">Freshness {listing.freshness_status || 'fresh'}</Badge>
          <Badge variant="outline">Publication {listing.publication_status || 'draft'}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr,320px]">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-2xl bg-muted/60 p-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="permit">Permit</TabsTrigger>
            <TabsTrigger value="authority">Authority</TabsTrigger>
            <TabsTrigger value="trust">Trust score</TabsTrigger>
            <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
            <TabsTrigger value="freshness">Freshness</TabsTrigger>
            <TabsTrigger value="cases">Compliance cases</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="history">Publication history</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="space-y-2 p-5 text-sm text-muted-foreground"><p>{listing.description || 'No description yet.'}</p><p>Missing requirements: {listing.missing_requirements?.join(', ') || 'None'}</p><p>Open issues: {listing.open_issue_codes?.join(', ') || 'None'}</p></CardContent></Card></TabsContent>
          <TabsContent value="verification"><DataListCard title="Verification checks" items={verification} render={(item) => <div key={item.id} className="rounded-2xl border border-white/10 p-3"><p className="font-medium">{item.verification_type}</p><p className="text-sm text-muted-foreground">{item.status} · {item.decision_reason || item.notes || 'No notes'}</p></div>} /></TabsContent>
          <TabsContent value="permit"><DataListCard title="Permit records" items={permits} render={(item) => <div key={item.id} className="rounded-2xl border border-white/10 p-3"><p className="font-medium">{item.permit_number}</p><p className="text-sm text-muted-foreground">{item.status} · Expires {item.expiry_date || '—'}</p></div>} /></TabsContent>
          <TabsContent value="authority"><DataListCard title="Authority records" items={authority} render={(item) => <div key={item.id} className="rounded-2xl border border-white/10 p-3"><p className="font-medium">{item.authority_name}</p><p className="text-sm text-muted-foreground">{item.record_type} · {item.status}</p></div>} /></TabsContent>
          <TabsContent value="trust"><Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="space-y-2 p-5 text-sm text-muted-foreground"><p>Trust score: {listing.trust_score || 0}</p><p>Completeness: {listing.completeness_score || 0}</p><p>Freshness score: {listing.freshness_score || 0}</p><p>Duplicate risk: {listing.duplicate_risk_score || 0}</p><p>Evidence count: {listing.evidence_count || 0}</p></CardContent></Card></TabsContent>
          <TabsContent value="duplicates"><ListingDuplicateReviewPanel listing={listing} reviews={duplicateReviews} relatedListings={relatedListings} loadingAction={duplicateReviewMutation.isPending ? (duplicateReviewMutation.variables?.reviewId || duplicateReviewMutation.variables?.decision) : null} onReview={(payload) => duplicateReviewMutation.mutate(payload)} /></TabsContent>
          <TabsContent value="freshness"><Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="space-y-2 p-5 text-sm text-muted-foreground"><p>Freshness: {listing.freshness_status || 'fresh'}</p><p>Last refreshed: {listing.last_refreshed_at ? new Date(listing.last_refreshed_at).toLocaleString() : 'Not recorded'}</p><p>Last checked: {listing.last_checked_at ? new Date(listing.last_checked_at).toLocaleString() : 'Not recorded'}</p><p>Stale threshold: {listing.stale_after_days || 30} days</p></CardContent></Card></TabsContent>
          <TabsContent value="cases"><DataListCard title="Compliance cases" items={cases} render={(item) => <div key={item.id} className="rounded-2xl border border-white/10 p-3"><p className="font-medium">{item.summary}</p><p className="text-sm text-muted-foreground">{item.category} · {item.status} · {item.severity}</p></div>} /></TabsContent>
          <TabsContent value="evidence"><ListingEvidenceReviewPanel evidence={evidence} loadingAction={evidenceReviewMutation.isPending ? evidenceReviewMutation.variables?.evidenceId : null} onReview={(payload) => evidenceReviewMutation.mutate(payload)} /></TabsContent>
          <TabsContent value="history"><DataListCard title="Publication decisions" items={decisions} render={(item) => <div key={item.id} className="rounded-2xl border border-white/10 p-3"><p className="font-medium">{item.decision_type}</p><p className="text-sm text-muted-foreground">{item.decision_status} · {item.reason || 'No reason'}</p></div>} /></TabsContent>
          <TabsContent value="audit"><DataListCard title="Audit trail" items={audit} render={(item) => <div key={item.id} className="rounded-2xl border border-white/10 p-3"><p className="font-medium">{item.summary}</p><p className="text-sm text-muted-foreground">{item.action} · {item.created_date ? new Date(item.created_date).toLocaleString() : '—'}</p></div>} /></TabsContent>
        </Tabs>

        <div className="space-y-4">
          <ListingPublicationActions onAction={decisionMutation.mutate} loading={decisionMutation.isPending} />
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Governance refresh</CardTitle></CardHeader>
            <CardContent><button className="inline-flex h-9 w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium" onClick={() => evaluateMutation.mutate()} disabled={evaluateMutation.isPending}>Recalculate trust and readiness</button></CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
