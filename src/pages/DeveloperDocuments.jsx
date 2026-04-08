import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import useDeveloperPortalWorkspace from "@/hooks/useDeveloperPortalWorkspace";
import { createEntitySafe } from "@/lib/base44Safeguards";
import { developerDocumentTypeOptions } from "@/lib/developerLifecycle";
import { compactLabel } from "@/lib/revenue";

export default function DeveloperDocuments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: workspace, current } = useDeveloperPortalWorkspace();
  const [form, setForm] = useState({
    title: "",
    document_type: "agreement_pdf",
    file_url: "",
    linked_scope: "organisation",
    linked_id: "",
    notes: "",
  });

  const scopeOptions = useMemo(() => {
    const items = [
      { value: "organisation", label: "Organisation", options: [{ id: workspace.organisation?.id || "", label: workspace.organisation?.trading_name || workspace.organisation?.legal_name || "Organisation" }] },
      { value: "project", label: "Project", options: workspace.projects.map((item) => ({ id: item.id, label: item.name })) },
      { value: "listing", label: "Listing", options: workspace.listings.map((item) => ({ id: item.id, label: item.title })) },
      { value: "deal", label: "Deal", options: workspace.deals.map((item) => ({ id: item.id, label: item.deal_code || item.id })) },
    ];
    return items;
  }, [workspace]);

  const currentScopeOptions = scopeOptions.find((item) => item.value === form.linked_scope)?.options || [];

  const uploadDocument = useMutation({
    mutationFn: async () => {
      const scopeId = form.linked_scope === "organisation" ? workspace.organisation.id : form.linked_id;
      const payload = {
        case_id: workspace.organisation.id,
        developer_organisation_id: workspace.organisation.id,
        project_id: form.linked_scope === "project" ? scopeId : undefined,
        listing_id: form.linked_scope === "listing" ? scopeId : undefined,
        deal_id: form.linked_scope === "deal" ? scopeId : undefined,
        document_type: form.document_type,
        title: form.title.trim(),
        file_url: form.file_url.trim(),
        visibility: "partner_visible",
        uploaded_by: current?.user?.id,
        uploaded_at: new Date().toISOString(),
        notes: form.notes.trim(),
      };
      const result = await createEntitySafe("SecureDocument", payload);
      if (!result.ok) throw result.error || new Error("Document upload failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      setForm({
        title: "",
        document_type: "agreement_pdf",
        file_url: "",
        linked_scope: "organisation",
        linked_id: "",
        notes: "",
      });
      toast({ title: "Document uploaded" });
    },
    onError: () => {
      toast({ title: "Document upload failed", variant: "destructive" });
    },
  });

  if (!workspace.organisation) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Developer portal" title="Documents" description="Document access is available after a developer organisation has been linked to your account." />
        <EmptyStateCard title="No developer organisation linked" description="Ask the internal team to complete your portal setup first." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Developer portal"
        title="Documents"
        description="Keep agreement PDFs, brochures, floor plans, reservation forms, SPA files, payment evidence, and handover documents in one controlled workspace."
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Shared document registry</CardTitle></CardHeader>
        <CardContent>
          {workspace.documents.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Linked scope</TableHead>
                  <TableHead>Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <a href={document.file_url} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-4 hover:underline">
                        {document.title}
                      </a>
                    </TableCell>
                    <TableCell>{compactLabel(document.document_type)}</TableCell>
                    <TableCell>{document.project_id || document.listing_id || document.deal_id || workspace.organisation.trading_name || workspace.organisation.legal_name}</TableCell>
                    <TableCell>{document.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyStateCard title="No documents yet" description="Upload agreements, brochures, floor plans, and deal evidence here." />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Upload document</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-document-title">Title</Label>
            <Input id="developer-document-title" value={form.title} onChange={(event) => setForm((currentForm) => ({ ...currentForm, title: event.target.value }))} placeholder="Reservation form - Unit 1402" />
          </div>
          <div className="space-y-2">
            <Label>Document type</Label>
            <Select value={form.document_type} onValueChange={(value) => setForm((currentForm) => ({ ...currentForm, document_type: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {developerDocumentTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Linked scope</Label>
            <Select value={form.linked_scope} onValueChange={(value) => setForm((currentForm) => ({ ...currentForm, linked_scope: value, linked_id: "" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {scopeOptions.map((scope) => (
                  <SelectItem key={scope.value} value={scope.value}>{scope.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.linked_scope !== "organisation" ? (
            <div className="space-y-2 md:col-span-2">
              <Label>Linked record</Label>
              <Select value={form.linked_id} onValueChange={(value) => setForm((currentForm) => ({ ...currentForm, linked_id: value }))}>
                <SelectTrigger><SelectValue placeholder="Select a linked record" /></SelectTrigger>
                <SelectContent>
                  {currentScopeOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-document-url">File URL</Label>
            <Input id="developer-document-url" value={form.file_url} onChange={(event) => setForm((currentForm) => ({ ...currentForm, file_url: event.target.value }))} placeholder="https://..." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-document-notes">Notes</Label>
            <Textarea id="developer-document-notes" value={form.notes} onChange={(event) => setForm((currentForm) => ({ ...currentForm, notes: event.target.value }))} className="min-h-24" placeholder="Optional note for internal reviewers or deal owners." />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => uploadDocument.mutate()} disabled={uploadDocument.isPending || !workspace.capabilities.canUploadDocuments || !form.title.trim() || !form.file_url.trim() || (form.linked_scope !== "organisation" && !form.linked_id)}>
              Upload document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
