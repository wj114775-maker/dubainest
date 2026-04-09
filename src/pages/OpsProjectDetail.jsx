import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import OpsProjectEditorDialog from "@/components/ops/OpsProjectEditorDialog";
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
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { listDeveloperOpsWorkspace } from "@/lib/developerLifecycle";
import { listProjectProfiles } from "@/lib/projectProfiles";
import { createEntitySafe, updateEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, formatCurrency } from "@/lib/revenue";

const emptyWorkspace = {
  organisations: [],
  prospects: [],
  activities: [],
  agreements: [],
  deals: [],
  listingRevisions: [],
  projectRevisions: [],
  memberships: [],
  projects: [],
  listings: [],
  documents: [],
  disputes: [],
  entitlements: [],
  developerProfiles: [],
  projectProfiles: [],
  auditLog: [],
};

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function OpsProjectDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: current } = useCurrentUserRole();
  const [editorOpen, setEditorOpen] = useState(false);
  const [documentForm, setDocumentForm] = useState({ title: "", document_type: "brochure", file_url: "", notes: "" });

  const { data = { workspace: emptyWorkspace, projectProfiles: [], developerProfiles: [] } } = useQuery({
    queryKey: ["ops-project-workspace", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const [workspace, projectProfiles, developerProfiles] = await Promise.all([
        listDeveloperOpsWorkspace(),
        listProjectProfiles(),
        listDeveloperProfiles(),
      ]);
      return { workspace, projectProfiles, developerProfiles };
    },
    initialData: { workspace: emptyWorkspace, projectProfiles: [], developerProfiles: [] },
  });

  const workspace = data.workspace || emptyWorkspace;
  const project = workspace.projects.find((item) => item.id === id) || null;
  const organisation = workspace.organisations.find((item) => item.id === project?.developer_organisation_id || item.id === project?.developer_id) || null;
  const listings = workspace.listings.filter((item) => item.project_id === id);
  const listingIds = new Set(listings.map((item) => item.id));
  const deals = workspace.deals.filter((item) => item.project_id === id || listingIds.has(item.listing_id));
  const dealIds = new Set(deals.map((item) => item.id));
  const documents = workspace.documents.filter((item) => item.project_id === id || listingIds.has(item.listing_id) || dealIds.has(item.deal_id));
  const revisions = workspace.projectRevisions.filter((item) => item.project_id === id);
  const publicProfile = data.projectProfiles.find((profile) => profile.project_id === id || profile.slug === project?.slug || String(profile.project_name || "").trim().toLowerCase() === String(project?.name || "").trim().toLowerCase()) || null;
  const publicDeveloperProfile = organisation
    ? data.developerProfiles.find((profile) => (
      profile.slug === organisation.slug
      || String(profile.developer_name || "").trim().toLowerCase() === String(organisation.trading_name || organisation.legal_name || "").trim().toLowerCase()
    )) || null
    : null;

  const auditEntityIds = new Set([
    id,
    ...listings.map((item) => item.id),
    ...deals.map((item) => item.id),
    ...documents.map((item) => item.id),
    ...revisions.map((item) => item.id),
  ]);
  const auditEntries = workspace.auditLog.filter((entry) => (
    auditEntityIds.has(entry.entity_id)
    || entry.metadata?.project_id === id
    || entry.metadata?.listing_id && listingIds.has(entry.metadata.listing_id)
    || entry.metadata?.deal_id && dealIds.has(entry.metadata.deal_id)
  ));

  const summary = useMemo(() => ({
    listings: listings.length,
    deals: deals.length,
    documents: documents.length,
    revisions: revisions.length,
  }), [deals.length, documents.length, listings.length, revisions.length]);

  const saveProject = useMutation({
    mutationFn: async (payload) => {
      const result = await updateEntitySafe("Project", id, payload);
      if (!result.ok) throw result.error || new Error("Project save failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ops-project-workspace", id] });
      queryClient.invalidateQueries({ queryKey: ["ops-projects-registry"] });
      setEditorOpen(false);
      toast({ title: "Project updated" });
    },
    onError: () => toast({ title: "Project update failed", variant: "destructive" }),
  });

  const uploadDocument = useMutation({
    mutationFn: async () => {
      const result = await createEntitySafe("SecureDocument", {
        case_id: organisation?.id || id,
        developer_organisation_id: organisation?.id || "",
        project_id: id,
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
      queryClient.invalidateQueries({ queryKey: ["ops-project-workspace", id] });
      setDocumentForm({ title: "", document_type: "brochure", file_url: "", notes: "" });
      toast({ title: "Project document uploaded" });
    },
    onError: () => toast({ title: "Project document upload failed", variant: "destructive" }),
  });

  if (!project) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Back office" title="Project workspace" description="Review a single project across listings, documents, deals, revisions, publishing, and audit." />
        <EmptyStateCard title="Project not found" description="Return to the projects registry and choose a project record." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Back office"
        title={project.name}
        description="One project record, one workspace. Review inventory, deals, documents, publishing, and audit from a single page."
        action={(
          <div className="flex gap-3">
            <Button variant="outline" asChild><Link to="/ops/projects/registry">Back to projects</Link></Button>
            <Button onClick={() => setEditorOpen(true)}>Edit project</Button>
          </div>
        )}
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="flex flex-wrap items-center gap-3 p-6">
          <Badge variant="outline">{compactLabel(project.status)}</Badge>
          <Badge variant="outline">Publication {compactLabel(project.publication_status || "draft")}</Badge>
          <Badge variant="outline">Review {compactLabel(project.request_review_status || "none")}</Badge>
          <span className="text-sm text-muted-foreground">
            Developer: {organisation?.trading_name || organisation?.legal_name || "Unassigned"}
          </span>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Listings</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="revisions">Revisions</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Project profile</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Developer: <span className="text-foreground">{organisation?.trading_name || organisation?.legal_name || "Unassigned"}</span></p>
                <p>Status: <span className="text-foreground">{compactLabel(project.status)}</span></p>
                <p>Publication: <span className="text-foreground">{compactLabel(project.publication_status || "draft")}</span></p>
                <p>Review: <span className="text-foreground">{compactLabel(project.request_review_status || "none")}</span></p>
                <p>Handover: <span className="text-foreground">{project.handover_date || "—"}</span></p>
                <p>Price from: <span className="text-foreground">{project.price_from ? formatCurrency(project.price_from) : "—"}</span></p>
                <p>Updated: <span className="text-foreground">{formatDateTime(project.updated_date || project.created_date)}</span></p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Workspace counts</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Listings</p><p className="mt-2 text-2xl font-semibold">{summary.listings}</p></div>
                <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Deals</p><p className="mt-2 text-2xl font-semibold">{summary.deals}</p></div>
                <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Documents</p><p className="mt-2 text-2xl font-semibold">{summary.documents}</p></div>
                <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Pending revisions</p><p className="mt-2 text-2xl font-semibold">{summary.revisions}</p></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="inventory">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Linked listings</CardTitle></CardHeader>
            <CardContent>
              {listings.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Listing</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Publication</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.map((listing) => (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <p className="font-medium">{listing.title}</p>
                          <p className="text-xs text-muted-foreground">{listing.slug || "No slug set yet"}</p>
                        </TableCell>
                        <TableCell>{compactLabel(listing.status)}</TableCell>
                        <TableCell>{compactLabel(listing.publication_status || "draft")}</TableCell>
                        <TableCell>{formatCurrency(listing.price || 0)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm"><Link to={`/ops/listings/${listing.id}`}>Open listing</Link></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyStateCard title="No listings linked" description="Listings assigned to this project will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Project deals</CardTitle></CardHeader>
            <CardContent>
              {deals.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal code</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Handover</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => (
                      <TableRow key={deal.id}>
                        <TableCell>{deal.deal_code || deal.id}</TableCell>
                        <TableCell>{deal.buyer_name || "Buyer"}</TableCell>
                        <TableCell>{compactLabel(deal.stage)}</TableCell>
                        <TableCell>{compactLabel(deal.payment_status)}</TableCell>
                        <TableCell>{compactLabel(deal.handover_status)}</TableCell>
                        <TableCell>{formatCurrency(deal.sale_price || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyStateCard title="No deals linked" description="Reservation and sale progression linked to this project will appear here." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Project documents</CardTitle></CardHeader>
              <CardContent>
                {documents.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Uploaded</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <a href={document.file_url} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
                              {document.title}
                            </a>
                          </TableCell>
                          <TableCell>{compactLabel(document.document_type)}</TableCell>
                          <TableCell>{formatDateTime(document.uploaded_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyStateCard title="No documents yet" description="Upload brochures, floor plans, and deal files for this project." />
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Upload document</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ops-project-document-title">Title</Label>
                  <Input id="ops-project-document-title" value={documentForm.title} onChange={(event) => setDocumentForm((current) => ({ ...current, title: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ops-project-document-type">Type</Label>
                  <Input id="ops-project-document-type" value={documentForm.document_type} onChange={(event) => setDocumentForm((current) => ({ ...current, document_type: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ops-project-document-url">URL</Label>
                  <Input id="ops-project-document-url" value={documentForm.file_url} onChange={(event) => setDocumentForm((current) => ({ ...current, file_url: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ops-project-document-notes">Notes</Label>
                  <Textarea id="ops-project-document-notes" value={documentForm.notes} onChange={(event) => setDocumentForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-24" />
                </div>
                <Button onClick={() => uploadDocument.mutate()} disabled={uploadDocument.isPending || !documentForm.title.trim() || !documentForm.file_url.trim()}>
                  Upload document
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revisions">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Project revision requests</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {revisions.length ? revisions.map((revision) => (
                <div key={revision.id} className="rounded-2xl border border-white/10 p-4">
                  <p className="font-medium">{revision.name || project.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{[compactLabel(revision.change_type), compactLabel(revision.review_status), formatDateTime(revision.submitted_at)].filter(Boolean).join(" · ")}</p>
                  {revision.notes ? <p className="mt-2 text-sm text-muted-foreground">{revision.notes}</p> : null}
                </div>
              )) : <EmptyStateCard title="No revisions yet" description="Governed project update requests will appear here." />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="publishing">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Public project page</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {publicProfile ? (
                  <>
                    <p>Project page: <span className="text-foreground">{publicProfile.project_name}</span></p>
                    <p>Status: <span className="text-foreground">{compactLabel(publicProfile.page_status || "draft")}</span></p>
                    <p>Homepage: <span className="text-foreground">{publicProfile.show_on_homepage ? "Yes" : "No"}</span></p>
                    <p>Slug: <span className="text-foreground">{publicProfile.slug || "—"}</span></p>
                    <div className="pt-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/projects/${publicProfile.slug}`}>Open public page</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <EmptyStateCard title="No public project page linked" description="Create or link a public ProjectProfile from the publishing desk." />
                )}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border-white/10 bg-card/80">
              <CardHeader><CardTitle>Publishing context</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Developer page: <span className="text-foreground">{publicDeveloperProfile?.developer_name || organisation?.trading_name || organisation?.legal_name || "Not linked"}</span></p>
                <p>Operational publication: <span className="text-foreground">{compactLabel(project.publication_status || "draft")}</span></p>
                <p>Review status: <span className="text-foreground">{compactLabel(project.request_review_status || "none")}</span></p>
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/ops/projects/publishing">Open publishing desk</Link>
                  </Button>
                </div>
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
              )) : <EmptyStateCard title="No audit entries" description="Project audit events will appear here as the workspace is used." />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <OpsProjectEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        project={project}
        organisations={workspace.organisations}
        loading={saveProject.isPending}
        onSubmit={(payload) => saveProject.mutate(payload)}
      />
    </div>
  );
}
