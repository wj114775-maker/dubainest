import React, { useEffect, useMemo, useState } from "react";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { developerSignatureProviderOptions } from "@/lib/developerLifecycle";
import { compactLabel } from "@/lib/revenue";

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

function getAgreementLabel(agreement) {
  return agreement.agreement_code || agreement.agreement_type || "Developer agreement";
}

export default function DeveloperAgreementsTab({
  agreements = [],
  organisations = [],
  prospects = [],
  documents = [],
  loading = false,
  onManageAgreement,
}) {
  const [selectedAgreementId, setSelectedAgreementId] = useState("");
  const [form, setForm] = useState({
    signature_provider: "manual",
    signature_request_url: "",
    signature_request_id: "",
    counterparty_name: "",
    counterparty_email: "",
    document_url: "",
    signed_document_url: "",
    signed_document_title: "",
    handoff_notes: "",
    decline_reason: "",
  });

  useEffect(() => {
    if (!agreements.length) {
      setSelectedAgreementId("");
      return;
    }
    if (!agreements.some((item) => item.id === selectedAgreementId)) {
      setSelectedAgreementId(agreements[0].id);
    }
  }, [agreements, selectedAgreementId]);

  const selectedAgreement = useMemo(
    () => agreements.find((item) => item.id === selectedAgreementId) || agreements[0] || null,
    [agreements, selectedAgreementId]
  );

  useEffect(() => {
    if (!selectedAgreement) return;
    setForm({
      signature_provider: selectedAgreement.signature_provider || "manual",
      signature_request_url: selectedAgreement.signature_request_url || "",
      signature_request_id: selectedAgreement.signature_request_id || "",
      counterparty_name: selectedAgreement.counterparty_name || "",
      counterparty_email: selectedAgreement.counterparty_email || "",
      document_url: selectedAgreement.document_url || "",
      signed_document_url: selectedAgreement.signed_document_url || "",
      signed_document_title: "",
      handoff_notes: selectedAgreement.handoff_notes || selectedAgreement.notes || "",
      decline_reason: selectedAgreement.decline_reason || "",
    });
  }, [selectedAgreement]);

  const selectedDocuments = useMemo(() => {
    if (!selectedAgreement) return [];
    return documents.filter((item) => (
      item.developer_organisation_id === selectedAgreement.developer_organisation_id
      && ["agreement_pdf", "signed_agreement"].includes(item.document_type)
    ));
  }, [documents, selectedAgreement]);

  const handleSubmit = (action) => {
    if (!selectedAgreement || !onManageAgreement) return;
    onManageAgreement(selectedAgreement, action, form);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Developer agreements</CardTitle></CardHeader>
        <CardContent>
          {agreements.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Developer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signature</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Reminder</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead className="text-right">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agreements.map((agreement) => {
                  const organisation = organisations.find((item) => item.id === agreement.developer_organisation_id);
                  const prospect = prospects.find((item) => item.id === agreement.developer_prospect_id);
                  return (
                    <TableRow key={agreement.id}>
                      <TableCell>{getAgreementLabel(agreement)}</TableCell>
                      <TableCell>{organisation?.trading_name || organisation?.legal_name || prospect?.company_name || "Prospect"}</TableCell>
                      <TableCell><Badge variant="outline">{compactLabel(agreement.agreement_status)}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{compactLabel(agreement.signature_status)}</Badge></TableCell>
                      <TableCell>{agreement.signature_provider ? compactLabel(agreement.signature_provider) : "—"}</TableCell>
                      <TableCell>{formatDateTime(agreement.sent_at)}</TableCell>
                      <TableCell>{formatDateTime(agreement.last_reminder_at)}</TableCell>
                      <TableCell>{formatDateTime(agreement.signed_at)}</TableCell>
                      <TableCell className="text-right">
                        {onManageAgreement ? (
                          <Button variant={selectedAgreement?.id === agreement.id ? "default" : "outline"} size="sm" onClick={() => setSelectedAgreementId(agreement.id)}>
                            Manage
                          </Button>
                        ) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyStateCard title="No agreements yet" description="Send an agreement from the prospect workflow to populate this desk." />
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Signature handoff</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {selectedAgreement ? (
            <>
              <div className="space-y-2">
                <p className="font-medium">{getAgreementLabel(selectedAgreement)}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{compactLabel(selectedAgreement.agreement_status)}</Badge>
                  <Badge variant="outline">{compactLabel(selectedAgreement.signature_status)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Counterparty {selectedAgreement.counterparty_name || form.counterparty_name || "not set"} · {selectedAgreement.counterparty_email || form.counterparty_email || "email missing"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Signature provider</Label>
                <Select value={form.signature_provider} onValueChange={(value) => setForm((current) => ({ ...current, signature_provider: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {developerSignatureProviderOptions.map((option) => (
                      <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-request-url">Signature request URL</Label>
                <Input id="agreement-request-url" value={form.signature_request_url} onChange={(event) => setForm((current) => ({ ...current, signature_request_url: event.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-request-id">Request ID</Label>
                <Input id="agreement-request-id" value={form.signature_request_id} onChange={(event) => setForm((current) => ({ ...current, signature_request_id: event.target.value }))} placeholder="sig-..." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="agreement-counterparty-name">Signer name</Label>
                  <Input id="agreement-counterparty-name" value={form.counterparty_name} onChange={(event) => setForm((current) => ({ ...current, counterparty_name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agreement-counterparty-email">Signer email</Label>
                  <Input id="agreement-counterparty-email" value={form.counterparty_email} onChange={(event) => setForm((current) => ({ ...current, counterparty_email: event.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-doc-url">Agreement PDF URL</Label>
                <Input id="agreement-doc-url" value={form.document_url} onChange={(event) => setForm((current) => ({ ...current, document_url: event.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-signed-url">Signed document URL</Label>
                <Input id="agreement-signed-url" value={form.signed_document_url} onChange={(event) => setForm((current) => ({ ...current, signed_document_url: event.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-signed-title">Signed document title</Label>
                <Input id="agreement-signed-title" value={form.signed_document_title} onChange={(event) => setForm((current) => ({ ...current, signed_document_title: event.target.value }))} placeholder="Signed agreement - Q2 mandate" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-handoff-notes">Handoff notes</Label>
                <Textarea id="agreement-handoff-notes" value={form.handoff_notes} onChange={(event) => setForm((current) => ({ ...current, handoff_notes: event.target.value }))} className="min-h-24" placeholder="Capture signature instructions, commercial notes, or blockers." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agreement-decline-reason">Decline reason</Label>
                <Textarea id="agreement-decline-reason" value={form.decline_reason} onChange={(event) => setForm((current) => ({ ...current, decline_reason: event.target.value }))} className="min-h-20" placeholder="Only needed if the developer declines the signature request." />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => handleSubmit("prepare_handoff")} disabled={loading}>Prepare</Button>
                <Button onClick={() => handleSubmit("send_for_signature")} disabled={loading || !form.counterparty_email.trim()}>Send</Button>
                <Button variant="outline" onClick={() => handleSubmit("send_reminder")} disabled={loading}>Reminder</Button>
                <Button variant="outline" onClick={() => handleSubmit("mark_signed")} disabled={loading}>Mark signed</Button>
                <Button variant="outline" onClick={() => handleSubmit("mark_declined")} disabled={loading || !form.decline_reason.trim()}>Declined</Button>
              </div>

              {selectedAgreement.signature_request_url || form.signature_request_url ? (
                <a
                  href={selectedAgreement.signature_request_url || form.signature_request_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Open signature request
                </a>
              ) : null}

              <div className="space-y-2 border-t border-white/10 pt-4">
                <p className="text-sm font-medium">Agreement documents</p>
                {selectedDocuments.length ? selectedDocuments.map((item) => (
                  <a key={item.id} href={item.file_url} target="_blank" rel="noreferrer" className="block text-sm text-primary underline-offset-4 hover:underline">
                    {item.title} · {compactLabel(item.document_type)}
                  </a>
                )) : <p className="text-sm text-muted-foreground">No agreement documents linked yet.</p>}
              </div>
            </>
          ) : (
            <EmptyStateCard title="Select an agreement" description="Choose an agreement row to manage its signature handoff." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
