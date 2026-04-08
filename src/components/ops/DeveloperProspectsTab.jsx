import React from "react";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { developerInterestOptions, developerProspectStageOptions } from "@/lib/developerLifecycle";
import { compactLabel } from "@/lib/revenue";

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function DeveloperProspectsTab({
  prospects = [],
  form,
  setForm,
  onSubmit,
  onAction,
  loading = false,
  currentUserId = "",
  disabledReason = "",
}) {
  const workflowDisabled = Boolean(disabledReason);

  return (
    <div className="space-y-6">
      {workflowDisabled ? (
        <Alert className="border-amber-300/60 bg-amber-50 text-amber-950">
          <AlertTitle>Publish required</AlertTitle>
          <AlertDescription>{disabledReason}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Add prospect</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="developer-prospect-company">Company name</Label>
            <Input id="developer-prospect-company" value={form.company_name} onChange={(event) => setForm((currentForm) => ({ ...currentForm, company_name: event.target.value }))} placeholder="Developer name" disabled={workflowDisabled || loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-prospect-contact">Main contact</Label>
            <Input id="developer-prospect-contact" value={form.main_contact_name} onChange={(event) => setForm((currentForm) => ({ ...currentForm, main_contact_name: event.target.value }))} placeholder="Contact name" disabled={workflowDisabled || loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-prospect-email">Email</Label>
            <Input id="developer-prospect-email" value={form.email} onChange={(event) => setForm((currentForm) => ({ ...currentForm, email: event.target.value }))} placeholder="contact@example.com" disabled={workflowDisabled || loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-prospect-phone">Phone</Label>
            <Input id="developer-prospect-phone" value={form.phone} onChange={(event) => setForm((currentForm) => ({ ...currentForm, phone: event.target.value }))} placeholder="+971..." disabled={workflowDisabled || loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-prospect-source">Source</Label>
            <Input id="developer-prospect-source" value={form.source} onChange={(event) => setForm((currentForm) => ({ ...currentForm, source: event.target.value }))} placeholder="Referral, event, inbound..." disabled={workflowDisabled || loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-prospect-owner">Owner</Label>
            <Input id="developer-prospect-owner" value={form.owner_user_id} onChange={(event) => setForm((currentForm) => ({ ...currentForm, owner_user_id: event.target.value }))} placeholder={currentUserId || "User ID"} disabled={workflowDisabled || loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-prospect-follow-up">Next follow-up</Label>
            <Input id="developer-prospect-follow-up" type="datetime-local" value={form.next_follow_up_at} onChange={(event) => setForm((currentForm) => ({ ...currentForm, next_follow_up_at: event.target.value }))} disabled={workflowDisabled || loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="developer-prospect-interest">Interest</Label>
            <select id="developer-prospect-interest" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.interest} onChange={(event) => setForm((currentForm) => ({ ...currentForm, interest: event.target.value }))} disabled={workflowDisabled || loading}>
              {developerInterestOptions.map((option) => <option key={option} value={option}>{compactLabel(option)}</option>)}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="developer-prospect-notes">Notes</Label>
            <Textarea id="developer-prospect-notes" value={form.notes} onChange={(event) => setForm((currentForm) => ({ ...currentForm, notes: event.target.value }))} className="min-h-24" placeholder="Commercial notes or follow-up context." disabled={workflowDisabled || loading} />
          </div>
          <div className="md:col-span-2">
            <Button onClick={onSubmit} disabled={workflowDisabled || loading || !form.company_name.trim()}>Add prospect</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Prospect pipeline</CardTitle></CardHeader>
        <CardContent>
          {prospects.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Interest</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Agreement</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{prospect.company_name}</p>
                        <p className="text-xs text-muted-foreground">{[prospect.main_contact_name, prospect.email, prospect.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{prospect.owner_user_id || "Unassigned"}</TableCell>
                    <TableCell>
                      <select className="flex h-9 rounded-md border border-input bg-background px-2 text-sm" value={prospect.stage || "uncontacted"} onChange={(event) => onAction(prospect, "stage", event.target.value)} disabled={workflowDisabled || loading}>
                        {developerProspectStageOptions.map((option) => <option key={option} value={option}>{compactLabel(option)}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>{compactLabel(prospect.interest)}</TableCell>
                    <TableCell>{formatDateTime(prospect.next_follow_up_at)}</TableCell>
                    <TableCell>{compactLabel(prospect.agreement_status || "not_sent")} · {compactLabel(prospect.signature_status || "not_sent")}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "own")} disabled={workflowDisabled || loading}>Own</Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "call")} disabled={workflowDisabled || loading}>Call</Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "email")} disabled={workflowDisabled || loading}>Email</Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "meeting")} disabled={workflowDisabled || loading}>Meeting</Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "send_agreement")} disabled={workflowDisabled || loading}>Agreement</Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "send_reminder")} disabled={workflowDisabled || loading}>Reminder</Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "not_interested")} disabled={workflowDisabled || loading}>Not interested</Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "archive")} disabled={workflowDisabled || loading}>Archive</Button>
                        <Button variant="outline" size="sm" onClick={() => onAction(prospect, "convert")} disabled={workflowDisabled || loading}>Convert</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyStateCard title="No developer prospects yet" description="Add your first prospect to start the pipeline." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
