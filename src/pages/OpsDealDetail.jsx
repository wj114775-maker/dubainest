import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import BuyerMatchingPanel from "@/components/ops/BuyerMatchingPanel";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import SectionHeading from "@/components/common/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { buildBuyerMatchSummary, listBuyerMatchingWorkspace } from "@/lib/buyerMatching";
import { buildDeveloperDealWorkflowPayload, listDeveloperOpsWorkspace } from "@/lib/developerLifecycle";
import { createEntitySafe, updateEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, formatCurrency } from "@/lib/revenue";

const emptyOpsWorkspace = {
  organisations: [],
  deals: [],
  projects: [],
  listings: [],
  documents: [],
  disputes: [],
  entitlements: [],
  auditLog: [],
};

const emptyMatchingWorkspace = {
  leads: [],
  leadIdentities: [],
  viewings: [],
  leadAssignments: [],
  conciergeCases: [],
};

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function OpsDealDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: current } = useCurrentUserRole();
  const [documentForm, setDocumentForm] = useState({ title: "", document_type: "reservation_form", file_url: "", notes: "" });
  const [note, setNote] = useState("");

  const { data = { opsWorkspace: emptyOpsWorkspace, matchingWorkspace: emptyMatchingWorkspace } } = useQuery({
    queryKey: ["ops-deal-workspace", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [opsWorkspace, matchingWorkspace] = await Promise.all([
        listDeveloperOpsWorkspace(),
        listBuyerMatchingWorkspace(),
      ]);
      return { opsWorkspace, matchingWorkspace };
    },
    initialData: { opsWorkspace: emptyOpsWorkspace, matchingWorkspace: emptyMatchingWorkspace },
  });

  const opsWorkspace = data.opsWorkspace || emptyOpsWorkspace;
  const matchingWorkspace = data.matchingWorkspace || emptyMatchingWorkspace;
  const deal = opsWorkspace.deals.find((item) => item.id === id) || null;
  const listing = opsWorkspace.listings.find((item) => item.id === deal?.listing_id) || null;
  const project = opsWorkspace.projects.find((item) => item.id === deal?.project_id) || null;
  const organisation = opsWorkspace.organisations.find((item) => item.id === deal?.developer_organisation_id || item.id === project?.developer_organisation_id || item.id === listing?.developer_organisation_id) || null;
  const directDocuments = opsWorkspace.documents.filter((item) => item.deal_id === id);
  const relatedDocuments = opsWorkspace.documents.filter((item) => (
    item.deal_id === id
    || (deal?.listing_id && item.listing_id === deal.listing_id)
    || (deal?.project_id && item.project_id === deal.project_id)
  ));
  const disputes = opsWorkspace.disputes.filter((item) => item.developer_deal_id === id);
  const entitlements = opsWorkspace.entitlements.filter((item) => item.developer_deal_id === id || item.deal_id === id);
  const auditEntries = opsWorkspace.auditLog.filter((entry) => (
    entry.entity_id === id
    || entry.metadata?.deal_id === id
    || entry.metadata?.developer_deal_id === id
  ));
  const matchingSummary = useMemo(() => buildBuyerMatchSummary({
    leads: matchingWorkspace.leads,
    leadIdentities: matchingWorkspace.leadIdentities,
    viewings: matchingWorkspace.viewings,
    leadAssignments: matchingWorkspace.leadAssignments,
    conciergeCases: matchingWorkspace.conciergeCases,
    deals: deal ? [deal] : [],
    listingIds: deal?.listing_id ? [deal.listing_id] : [],
    projectIds: deal?.project_id ? [deal.project_id] : [],
    leadIds: deal?.lead_id ? [deal.lead_id] : [],
  }), [deal, matchingWorkspace]);

  useEffect(() => {
    setNote(deal?.notes || "");
  }, [deal?.notes]);

  const progressDeal = useMutation({
    mutationFn: async (action) => {
      const result = await updateEntitySafe("DeveloperDeal", id, buildDeveloperDealWorkflowPayload(action, new Date().toISOString()));
      if (!result.ok) throw result.error || new Error("Developer deal update failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-deal-workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      queryClient.invalidateQueries({ queryKey: ["ops-deals-registry"] });
      toast({ title: "Deal workflow updated" });
    },
    onError: () => toast({ title: "Deal workflow update failed", variant: "destructive" }),
  });

  const saveNote = useMutation({
    mutationFn: async () => {
      const result = await updateEntitySafe("DeveloperDeal", id, { notes: note.trim() });
      if (!result.ok) throw result.error || new Error("Deal note update failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-deal-workspace", id] });
      toast({ title: "Commercial note updated" });
    },
    onError: () => toast({ title: "Commercial note update failed", variant: "destructive" }),
  });

  const uploadDocument = useMutation({
    mutationFn: async () => {
      const result = await createEntitySafe("SecureDocument", {
        case_id: organisation?.id || deal?.developer_organisation_id || id,
        developer_organisation_id: organisation?.id || deal?.developer_organisation_id || "",
        project_id: deal?.project_id || undefined,
        listing_id: deal?.listing_id || undefined,
        deal_id: id,
        document_type: documentForm.document_type,
        title: documentForm.title.trim(),
        file_url: documentForm.file_url.trim(),
        visibility: "partner_visible",
        uploaded_by: current?.user?.id,
        uploaded_at: new Date().toISOString(),
        notes: documentForm.notes.trim(),
      });
      if (!result.ok) throw result.error || new Error("Deal document upload failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-deal-workspace", id] });
      setDocumentForm({ title: "", document_type: "reservation_form", file_url: "", notes: "" });
      toast({ title: "Deal document uploaded" });
    },
    onError: () => toast({ title: "Deal document upload failed", variant: "destructive" }),
  });

  const raiseDispute = useMutation({
    mutationFn: async () => {
      const result = await createEntitySafe("RevenueDispute", {
        partner_id: deal?.assigned_partner_id || "",
        developer_organisation_id: deal?.developer_organisation_id || organisation?.id || "",
        developer_deal_id: id,
        dispute_type: "documentation_dispute",
        summary: `Internal dispute opened for ${deal?.deal_code || id}`,
        status: "open",
        opened_by: current?.user?.id,
        opened_at: new Date().toISOString(),
        notes: note.trim() || deal?.notes || "",
      });
      if (!result.ok) throw result.error || new Error("Dispute creation failed");
      await updateEntitySafe("DeveloperDeal", id, { dispute_status: "open" });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-deal-workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace"] });
      toast({ title: "Dispute opened" });
    },
    onError: () => toast({ title: "Dispute creation failed", variant: "destructive" }),
  });

  if (!deal) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Back office" title="Deal workspace" description="Review buyer matching, reservation, contract, payment, handover, revenue, and audit from a single deal page." />
        <EmptyStateCard title="Deal not found" description="Return to the deals desk and choose a developer-linked deal record." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title={deal.deal_code || deal.id}
        description="One deal record, one workspace. Review buyer linkage, documents, revenue, workflow, and audit without switching desks."
        action={(
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild><Link to="/ops/deals">Back to deals</Link></Button>
            {deal.lead_id ? <Button variant="outline" asChild><Link to={`/ops/leads/${deal.lead_id}`}>Open buyer</Link></Button> : null}
          </div>
        )}
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="flex flex-wrap items-center gap-3 p-6">
          <Badge variant="outline">{compactLabel(deal.stage)}</Badge>
          <Badge variant="outline">Reservation {compactLabel(deal.reservation_status)}</Badge>
          <Badge variant="outline">Contract {compactLabel(deal.contract_status)}</Badge>
          <Badge variant="outline">Payment {compactLabel(deal.payment_status)}</Badge>
          <Badge variant="outline">Handover {compactLabel(deal.handover_status)}</Badge>
          <span className="text-sm text-muted-foreground">Developer: {organisation?.trading_name || organisation?.legal_name || "Unassigned"}</span>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matching">Buyer match</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Deal summary</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Buyer: <span className="text-foreground">{deal.buyer_name || "Buyer"}</span></p>
                <p>Sale price: <span className="text-foreground">{formatCurrency(deal.sale_price || 0)}</span></p>
                <p>Expected platform fee: <span className="text-foreground">{formatCurrency(deal.expected_platform_fee || 0)}</span></p>
                <p>Expected commission: <span className="text-foreground">{formatCurrency(deal.expected_commission || 0)}</span></p>
                <p>Expected handover: <span className="text-foreground">{formatDateTime(deal.expected_handover_at)}</span></p>
                <p>Dispute state: <span className="text-foreground">{compactLabel(deal.dispute_status || "none")}</span></p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Linked records</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-sm text-muted-foreground">Listing</p>
                  <p className="mt-2 font-medium">{listing?.title || deal.listing_id || "Not linked"}</p>
                  {listing ? <Button asChild variant="outline" size="sm" className="mt-3"><Link to={`/ops/listings/${listing.id}`}>Open listing</Link></Button> : null}
                </div>
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="mt-2 font-medium">{project?.name || deal.project_id || "Not linked"}</p>
                  {project ? <Button asChild variant="outline" size="sm" className="mt-3"><Link to={`/ops/projects/${project.id}`}>Open project</Link></Button> : null}
                </div>
                <div className="rounded-2xl border border-white/10 p-4">
                  <p className="text-sm text-muted-foreground">Developer</p>
                  <p className="mt-2 font-medium">{organisation?.trading_name || organisation?.legal_name || deal.developer_organisation_id || "Not linked"}</p>
                  {organisation ? <Button asChild variant="outline" size="sm" className="mt-3"><Link to={`/ops/developers/${organisation.id}`}>Open developer</Link></Button> : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="matching">
          <BuyerMatchingPanel
            title="Buyer-to-listing matching"
            description="This deal view shows the exact buyer records touching the linked listing and project, with live deal linkage scored highest."
            summary={matchingSummary}
          />
        </TabsContent>

        <TabsContent value="workflow">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Deal progression</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => progressDeal.mutate("reservation_received")} disabled={progressDeal.isPending}>Reservation</Button>
                  <Button variant="outline" onClick={() => progressDeal.mutate("spa_sent")} disabled={progressDeal.isPending}>SPA sent</Button>
                  <Button variant="outline" onClick={() => progressDeal.mutate("spa_signed")} disabled={progressDeal.isPending}>SPA signed</Button>
                  <Button variant="outline" onClick={() => progressDeal.mutate("milestone_received")} disabled={progressDeal.isPending}>Milestone received</Button>
                  <Button variant="outline" onClick={() => progressDeal.mutate("handover_scheduled")} disabled={progressDeal.isPending}>Schedule handover</Button>
                  <Button variant="outline" onClick={() => progressDeal.mutate("handover_completed")} disabled={progressDeal.isPending}>Complete handover</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Reservation</p><p className="mt-2 font-medium">{compactLabel(deal.reservation_status)}</p></div>
                  <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Contract</p><p className="mt-2 font-medium">{compactLabel(deal.contract_status)}</p></div>
                  <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Payment</p><p className="mt-2 font-medium">{compactLabel(deal.payment_status)}</p></div>
                  <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Handover</p><p className="mt-2 font-medium">{compactLabel(deal.handover_status)}</p></div>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Commercial note</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ops-deal-note">Note</Label>
                  <Textarea id="ops-deal-note" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-32" placeholder={deal.notes || "Capture blockers, concessions, or handover notes."} />
                </div>
                <Button onClick={() => saveNote.mutate()} disabled={saveNote.isPending || !note.trim()}>Save note</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Linked deal documents</CardTitle></CardHeader>
              <CardContent>
                {relatedDocuments.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatedDocuments.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell><a href={document.file_url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">{document.title}</a></TableCell>
                          <TableCell>{compactLabel(document.document_type)}</TableCell>
                          <TableCell>{formatDateTime(document.uploaded_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : <EmptyStateCard title="No documents yet" description="Reservation, SPA, payment, and handover documents will appear here." />}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Upload document</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="ops-deal-document-title">Title</Label><Input id="ops-deal-document-title" value={documentForm.title} onChange={(event) => setDocumentForm((currentForm) => ({ ...currentForm, title: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-deal-document-type">Type</Label><Input id="ops-deal-document-type" value={documentForm.document_type} onChange={(event) => setDocumentForm((currentForm) => ({ ...currentForm, document_type: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-deal-document-url">URL</Label><Input id="ops-deal-document-url" value={documentForm.file_url} onChange={(event) => setDocumentForm((currentForm) => ({ ...currentForm, file_url: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-deal-document-notes">Notes</Label><Textarea id="ops-deal-document-notes" value={documentForm.notes} onChange={(event) => setDocumentForm((currentForm) => ({ ...currentForm, notes: event.target.value }))} className="min-h-24" /></div>
                <Button onClick={() => uploadDocument.mutate()} disabled={uploadDocument.isPending || !documentForm.title.trim() || !documentForm.file_url.trim()}>Upload document</Button>
                {directDocuments.length ? <p className="text-sm text-muted-foreground">{directDocuments.length} documents are linked directly to this deal.</p> : null}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Revenue records</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {entitlements.length ? entitlements.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4">
                    <p className="font-medium">{compactLabel(item.entitlement_status || "draft")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{[compactLabel(item.trigger_type || "manual"), formatCurrency(item.net_amount || item.gross_amount || 0), item.currency || "AED"].join(" · ")}</p>
                  </div>
                )) : <EmptyStateCard title="No entitlement yet" description="Fee entitlement records will appear here when the revenue workflow reaches this deal." />}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Disputes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {disputes.length ? disputes.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4">
                    <p className="font-medium">{item.summary}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{[compactLabel(item.status), compactLabel(item.dispute_type), formatDateTime(item.opened_at)].filter(Boolean).join(" · ")}</p>
                  </div>
                )) : <EmptyStateCard title="No disputes yet" description="Open a dispute when the developer or internal team needs to challenge documentation or revenue treatment." />}
                <Button variant="outline" onClick={() => raiseDispute.mutate()} disabled={raiseDispute.isPending}>Open dispute</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Audit trail</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {auditEntries.length ? auditEntries.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-medium">{entry.summary || entry.action || "Audit event"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{[entry.action, formatDateTime(entry.created_date), entry.actor_user_id || entry.actor_id].filter(Boolean).join(" · ")}</p>
                </div>
              )) : <EmptyStateCard title="No audit entries" description="Workflow, revenue, and document actions for this deal will appear here." />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
