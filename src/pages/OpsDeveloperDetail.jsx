import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { buildDeveloperFinanceSummary, createDeveloperActivity, listDeveloperOpsWorkspace } from "@/lib/developerLifecycle";
import { createEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, formatCurrency } from "@/lib/revenue";

const emptyWorkspace = {
  organisations: [],
  prospects: [],
  activities: [],
  agreements: [],
  deals: [],
  memberships: [],
  projects: [],
  listings: [],
  documents: [],
  disputes: [],
  entitlements: [],
  auditLog: [],
};

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function OpsDeveloperDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: current } = useCurrentUserRole();
  const [activityNote, setActivityNote] = useState("");
  const [documentForm, setDocumentForm] = useState({ title: "", document_type: "shared_request_doc", file_url: "", notes: "" });
  const [membershipForm, setMembershipForm] = useState({ user_id: "", membership_type: "developer_staff", status: "active", assignment_scope: "projects,listings,deals,documents" });

  const { data: workspace = emptyWorkspace } = useQuery({
    queryKey: ["ops-developer-workspace", id],
    queryFn: () => listDeveloperOpsWorkspace(),
    initialData: emptyWorkspace,
  });

  const organisation = workspace.organisations.find((item) => item.id === id) || null;
  const relatedProspects = workspace.prospects.filter((item) => item.developer_organisation_id === id);
  const activities = workspace.activities.filter((item) => item.developer_organisation_id === id || relatedProspects.some((prospect) => prospect.id === item.developer_prospect_id));
  const agreements = workspace.agreements.filter((item) => item.developer_organisation_id === id || relatedProspects.some((prospect) => prospect.id === item.developer_prospect_id));
  const projects = workspace.projects.filter((item) => item.developer_organisation_id === id || item.developer_id === id);
  const projectIds = new Set(projects.map((item) => item.id));
  const listings = workspace.listings.filter((item) => item.developer_organisation_id === id || item.developer_id === id || projectIds.has(item.project_id));
  const listingIds = new Set(listings.map((item) => item.id));
  const deals = workspace.deals.filter((item) => item.developer_organisation_id === id || projectIds.has(item.project_id) || listingIds.has(item.listing_id));
  const dealIds = new Set(deals.map((item) => item.id));
  const documents = workspace.documents.filter((item) => item.developer_organisation_id === id || item.case_id === id || projectIds.has(item.project_id) || listingIds.has(item.listing_id) || dealIds.has(item.deal_id));
  const memberships = workspace.memberships.filter((item) => item.organisation_id === id);
  const auditEntityIds = new Set([
    id,
    ...relatedProspects.map((item) => item.id),
    ...activities.map((item) => item.id),
    ...agreements.map((item) => item.id),
    ...projects.map((item) => item.id),
    ...listings.map((item) => item.id),
    ...deals.map((item) => item.id),
    ...documents.map((item) => item.id),
    ...memberships.map((item) => item.id),
  ]);
  const auditEntries = workspace.auditLog.filter((entry) => (
    auditEntityIds.has(entry.entity_id)
    || entry.target_user_id && memberships.some((membership) => membership.user_id === entry.target_user_id)
    || entry.metadata?.developer_organisation_id === id
    || entry.metadata?.organisation_id === id
    || entry.metadata?.membershipPayload?.organisation_id === id
  ));
  const finance = useMemo(() => buildDeveloperFinanceSummary({ organisationId: id, deals, entitlements: workspace.entitlements, disputes: workspace.disputes }), [deals, id, workspace.disputes, workspace.entitlements]);

  const addActivity = useMutation({
    mutationFn: async () => {
      const result = await createDeveloperActivity({
        developer_organisation_id: id,
        activity_type: "note",
        direction: "internal",
        actor_user_id: current?.user?.id,
        occurred_at: new Date().toISOString(),
        summary: activityNote.trim(),
        detail: activityNote.trim(),
      });
      if (!result.ok) throw result.error || new Error("Activity save failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace", id] });
      setActivityNote("");
      toast({ title: "Activity added" });
    },
    onError: () => toast({ title: "Activity save failed", variant: "destructive" }),
  });

  const uploadDocument = useMutation({
    mutationFn: async () => {
      const result = await createEntitySafe("SecureDocument", {
        case_id: id,
        developer_organisation_id: id,
        document_type: documentForm.document_type,
        title: documentForm.title.trim(),
        file_url: documentForm.file_url.trim(),
        visibility: "partner_visible",
        uploaded_by: current?.user?.id,
        uploaded_at: new Date().toISOString(),
        notes: documentForm.notes.trim(),
      });
      if (!result.ok) throw result.error || new Error("Document upload failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace", id] });
      setDocumentForm({ title: "", document_type: "shared_request_doc", file_url: "", notes: "" });
      toast({ title: "Document uploaded" });
    },
    onError: () => toast({ title: "Document upload failed", variant: "destructive" }),
  });

  const manageMembership = useMutation({
    mutationFn: async () => base44.functions.invoke("adminManageUserAccess", {
      action: "create_membership",
      membershipPayload: {
        user_id: membershipForm.user_id,
        organisation_type: "developer_organisation",
        organisation_id: id,
        membership_type: membershipForm.membership_type,
        status: membershipForm.status,
        assignment_scope: membershipForm.assignment_scope,
        notes: `Created from developer workspace for ${organisation?.trading_name || organisation?.legal_name || id}`,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-developer-workspace", id] });
      setMembershipForm({ user_id: "", membership_type: "developer_staff", status: "active", assignment_scope: "projects,listings,deals,documents" });
      toast({ title: "Membership created" });
    },
    onError: () => toast({ title: "Membership creation failed", variant: "destructive" }),
  });

  if (!organisation) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Back office" title="Developer workspace" description="Review a single developer organisation across contacts, agreements, inventory, deals, documents, and access." />
        <EmptyStateCard title="Developer not found" description="Return to the developer registry and choose a signed developer record." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title={organisation.trading_name || organisation.legal_name}
        description="One developer record, one workspace. Review activity, agreements, inventory, documents, access, and finance from a single page."
        action={<Button asChild variant="outline"><Link to="/ops/developers">Back to developers</Link></Button>}
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="flex flex-wrap items-center gap-3 p-6">
          <Badge variant="outline">{compactLabel(organisation.status)}</Badge>
          <Badge variant="outline">Agreement {compactLabel(organisation.agreement_status || "not_sent")}</Badge>
          <Badge variant="outline">Portal {organisation.portal_enabled ? "enabled" : "disabled"}</Badge>
          <span className="text-sm text-muted-foreground">Primary contact: {organisation.primary_contact_name || "Not set"}</span>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="finance">Finance summary</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Developer profile</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Legal name: <span className="text-foreground">{organisation.legal_name}</span></p>
                <p>Trading name: <span className="text-foreground">{organisation.trading_name || "—"}</span></p>
                <p>Agreement type: <span className="text-foreground">{organisation.agreement_type || "—"}</span></p>
                <p>Mandate scope: <span className="text-foreground">{organisation.mandate_scope || "—"}</span></p>
                <p>Source: <span className="text-foreground">{organisation.source || "—"}</span></p>
                <p>Last activity: <span className="text-foreground">{formatDateTime(organisation.last_activity_at)}</span></p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Workspace counts</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Projects</p><p className="mt-2 text-2xl font-semibold">{projects.length}</p></div>
                <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Listings</p><p className="mt-2 text-2xl font-semibold">{listings.length}</p></div>
                <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Deals</p><p className="mt-2 text-2xl font-semibold">{deals.length}</p></div>
                <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Documents</p><p className="mt-2 text-2xl font-semibold">{documents.length}</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Primary organisation contact</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Name: <span className="text-foreground">{organisation.primary_contact_name || "Not set"}</span></p>
                <p>Email: <span className="text-foreground">{organisation.primary_contact_email || "Not set"}</span></p>
                <p>Phone: <span className="text-foreground">{organisation.primary_contact_phone || "Not set"}</span></p>
                <p>City: <span className="text-foreground">{organisation.primary_city || "Not set"}</span></p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Prospect and onboarding contacts</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {relatedProspects.length ? relatedProspects.map((prospect) => (
                  <div key={prospect.id} className="rounded-2xl border border-white/10 p-4">
                    <p className="font-medium">{prospect.main_contact_name || prospect.company_name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{[prospect.email, prospect.phone, compactLabel(prospect.stage)].filter(Boolean).join(" · ")}</p>
                  </div>
                )) : <EmptyStateCard title="No prospect contacts" description="Contacts logged during prospecting and onboarding will appear here." />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Activity timeline</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {activities.length ? activities.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 p-4">
                    <p className="font-medium">{item.summary}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{[compactLabel(item.activity_type), formatDateTime(item.occurred_at), item.actor_user_id].filter(Boolean).join(" · ")}</p>
                  </div>
                )) : <EmptyStateCard title="No activity yet" description="Internal notes and logged outreach appear here." />}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Add activity note</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Textarea value={activityNote} onChange={(event) => setActivityNote(event.target.value)} className="min-h-32" placeholder="Capture an internal note, call summary, or next-step decision." />
                <Button onClick={() => addActivity.mutate()} disabled={addActivity.isPending || !activityNote.trim()}>Save note</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agreements">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Agreements</CardTitle></CardHeader>
            <CardContent>
              {agreements.length ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Agreement</TableHead><TableHead>Status</TableHead><TableHead>Signature</TableHead><TableHead>Sent</TableHead><TableHead>Signed</TableHead></TableRow></TableHeader>
                  <TableBody>{agreements.map((agreement) => <TableRow key={agreement.id}><TableCell>{agreement.agreement_code || agreement.agreement_type || "Developer agreement"}</TableCell><TableCell>{compactLabel(agreement.agreement_status)}</TableCell><TableCell>{compactLabel(agreement.signature_status)}</TableCell><TableCell>{formatDateTime(agreement.sent_at)}</TableCell><TableCell>{formatDateTime(agreement.signed_at)}</TableCell></TableRow>)}</TableBody>
                </Table>
              ) : <EmptyStateCard title="No agreements" description="Agreement records for this developer will appear here." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
            <CardContent>
              {projects.length ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Project</TableHead><TableHead>Status</TableHead><TableHead>Publication</TableHead><TableHead>Handover</TableHead></TableRow></TableHeader>
                  <TableBody>{projects.map((project) => <TableRow key={project.id}><TableCell>{project.name}</TableCell><TableCell>{compactLabel(project.status)}</TableCell><TableCell>{compactLabel(project.publication_status || "draft")}</TableCell><TableCell>{project.handover_date || "—"}</TableCell></TableRow>)}</TableBody>
                </Table>
              ) : <EmptyStateCard title="No projects" description="Projects linked to this developer will appear here." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="listings">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Listings</CardTitle></CardHeader>
            <CardContent>
              {listings.length ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Listing</TableHead><TableHead>Project</TableHead><TableHead>Status</TableHead><TableHead>Publication</TableHead><TableHead>Price</TableHead></TableRow></TableHeader>
                  <TableBody>{listings.map((listing) => <TableRow key={listing.id}><TableCell>{listing.title}</TableCell><TableCell>{projects.find((project) => project.id === listing.project_id)?.name || "Standalone"}</TableCell><TableCell>{compactLabel(listing.status)}</TableCell><TableCell>{compactLabel(listing.publication_status || "draft")}</TableCell><TableCell>{formatCurrency(listing.price || 0)}</TableCell></TableRow>)}</TableBody>
                </Table>
              ) : <EmptyStateCard title="No listings" description="Listings linked to this developer will appear here." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Deals</CardTitle></CardHeader>
            <CardContent>
              {deals.length ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Deal</TableHead><TableHead>Buyer</TableHead><TableHead>Stage</TableHead><TableHead>Payment</TableHead><TableHead>Handover</TableHead><TableHead>Value</TableHead></TableRow></TableHeader>
                  <TableBody>{deals.map((deal) => <TableRow key={deal.id}><TableCell>{deal.deal_code || deal.id}</TableCell><TableCell>{deal.buyer_name || "Buyer"}</TableCell><TableCell>{compactLabel(deal.stage)}</TableCell><TableCell>{compactLabel(deal.payment_status)}</TableCell><TableCell>{compactLabel(deal.handover_status)}</TableCell><TableCell>{formatCurrency(deal.sale_price || 0)}</TableCell></TableRow>)}</TableBody>
                </Table>
              ) : <EmptyStateCard title="No deals" description="Deals linked to this developer will appear here." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
              <CardContent>
                {documents.length ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Uploaded</TableHead></TableRow></TableHeader>
                    <TableBody>{documents.map((document) => <TableRow key={document.id}><TableCell><a href={document.file_url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">{document.title}</a></TableCell><TableCell>{compactLabel(document.document_type)}</TableCell><TableCell>{formatDateTime(document.uploaded_at)}</TableCell></TableRow>)}</TableBody>
                  </Table>
                ) : <EmptyStateCard title="No documents" description="Shared documents for this developer will appear here." />}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Upload document</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="ops-document-title">Title</Label><Input id="ops-document-title" value={documentForm.title} onChange={(event) => setDocumentForm((currentForm) => ({ ...currentForm, title: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-document-type">Type</Label><Input id="ops-document-type" value={documentForm.document_type} onChange={(event) => setDocumentForm((currentForm) => ({ ...currentForm, document_type: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-document-url">URL</Label><Input id="ops-document-url" value={documentForm.file_url} onChange={(event) => setDocumentForm((currentForm) => ({ ...currentForm, file_url: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-document-notes">Notes</Label><Textarea id="ops-document-notes" value={documentForm.notes} onChange={(event) => setDocumentForm((currentForm) => ({ ...currentForm, notes: event.target.value }))} className="min-h-24" /></div>
                <Button onClick={() => uploadDocument.mutate()} disabled={uploadDocument.isPending || !documentForm.title.trim() || !documentForm.file_url.trim()}>Upload</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="access">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Organisation memberships</CardTitle></CardHeader>
              <CardContent>
                {memberships.length ? (
                  <Table>
                    <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Membership</TableHead><TableHead>Status</TableHead><TableHead>Scope</TableHead></TableRow></TableHeader>
                    <TableBody>{memberships.map((membership) => <TableRow key={membership.id}><TableCell>{membership.user_id}</TableCell><TableCell>{compactLabel(membership.membership_type)}</TableCell><TableCell>{compactLabel(membership.status || "active")}</TableCell><TableCell>{membership.assignment_scope || "Full workspace"}</TableCell></TableRow>)}</TableBody>
                  </Table>
                ) : <EmptyStateCard title="No memberships" description="Add a developer membership to enable portal access." />}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Create membership</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label htmlFor="ops-membership-user">User ID</Label><Input id="ops-membership-user" value={membershipForm.user_id} onChange={(event) => setMembershipForm((currentForm) => ({ ...currentForm, user_id: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-membership-type">Membership type</Label><Input id="ops-membership-type" value={membershipForm.membership_type} onChange={(event) => setMembershipForm((currentForm) => ({ ...currentForm, membership_type: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-membership-status">Status</Label><Input id="ops-membership-status" value={membershipForm.status} onChange={(event) => setMembershipForm((currentForm) => ({ ...currentForm, status: event.target.value }))} /></div>
                <div className="space-y-2"><Label htmlFor="ops-membership-scope">Assignment scope</Label><Input id="ops-membership-scope" value={membershipForm.assignment_scope} onChange={(event) => setMembershipForm((currentForm) => ({ ...currentForm, assignment_scope: event.target.value }))} /></div>
                <Button onClick={() => manageMembership.mutate()} disabled={manageMembership.isPending || !membershipForm.user_id.trim()}>Create membership</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Finance summary</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Deals</p><p className="mt-2 text-2xl font-semibold">{finance.deals}</p></div>
              <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Sale value</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(finance.saleValue)}</p></div>
              <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Platform fee</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(finance.expectedPlatformFee)}</p></div>
              <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Commission</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(finance.expectedCommission)}</p></div>
              <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Open disputes</p><p className="mt-2 text-2xl font-semibold">{finance.openDisputes}</p></div>
            </CardContent>
          </Card>
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
              )) : <EmptyStateCard title="No audit entries" description="Audit events for developer memberships, activities, documents, and workflow actions will appear here." />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
