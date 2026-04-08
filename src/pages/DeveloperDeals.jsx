import React, { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import useDeveloperPortalWorkspace from "@/hooks/useDeveloperPortalWorkspace";
import { createEntitySafe, updateEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, formatCurrency } from "@/lib/revenue";

export default function DeveloperDeals() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: workspace, current } = useDeveloperPortalWorkspace();
  const [selectedDealId, setSelectedDealId] = useState("");
  const [note, setNote] = useState("");

  const selectedDeal = useMemo(() => workspace.deals.find((item) => item.id === selectedDealId) || null, [workspace.deals, selectedDealId]);

  const updateDeal = useMutation({
    mutationFn: async ({ deal, payload }) => {
      const result = await updateEntitySafe("DeveloperDeal", deal.id, payload);
      if (!result.ok) throw result.error || new Error("Deal update failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      toast({ title: "Deal updated" });
    },
    onError: () => {
      toast({ title: "Deal update failed", variant: "destructive" });
    },
  });

  const raiseDispute = useMutation({
    mutationFn: async (deal) => {
      const result = await createEntitySafe("RevenueDispute", {
        partner_id: deal.assigned_partner_id || workspace.organisation.id,
        developer_organisation_id: workspace.organisation.id,
        developer_deal_id: deal.id,
        dispute_type: "documentation_dispute",
        summary: `Developer dispute opened for ${deal.deal_code || deal.id}`,
        status: "open",
        opened_by: current?.user?.id,
        opened_at: new Date().toISOString(),
        notes: deal.notes || "",
      });
      if (!result.ok) throw result.error || new Error("Dispute creation failed");
      await updateEntitySafe("DeveloperDeal", deal.id, { dispute_status: "open" });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      toast({ title: "Dispute raised" });
    },
    onError: () => {
      toast({ title: "Dispute creation failed", variant: "destructive" });
    },
  });

  const saveNote = useMutation({
    mutationFn: async () => {
      if (!selectedDeal) return null;
      const result = await updateEntitySafe("DeveloperDeal", selectedDeal.id, { notes: note.trim() });
      if (!result.ok) throw result.error || new Error("Note save failed");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["developer-portal-workspace", current?.user?.id] });
      toast({ title: "Commercial note saved" });
    },
    onError: () => {
      toast({ title: "Commercial note save failed", variant: "destructive" });
    },
  });

  if (!workspace.organisation) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Developer portal" title="Deals" description="Deal access is available after a developer organisation has been linked to your account." />
        <EmptyStateCard title="No developer organisation linked" description="Ask the internal team to complete your portal setup first." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Developer portal"
        title="Deals"
        description="Track reservation, SPA, payment, and handover progression for deals linked to your projects and listings."
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Developer deal desk</CardTitle></CardHeader>
        <CardContent>
          {workspace.deals.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal code</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Reservation</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Handover</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspace.deals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>{deal.deal_code || deal.id}</TableCell>
                    <TableCell>{deal.buyer_name || "Buyer"}</TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(deal.stage)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(deal.reservation_status)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(deal.contract_status)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(deal.payment_status)}</Badge></TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(deal.handover_status)}</Badge></TableCell>
                    <TableCell>{formatCurrency(deal.sale_price || 0)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => updateDeal.mutate({ deal, payload: { stage: "reservation_pending", reservation_status: "received" } })}>Reservation</Button>
                        <Button variant="outline" size="sm" onClick={() => updateDeal.mutate({ deal, payload: { stage: "contract_pending", contract_status: "spa_sent" } })}>SPA sent</Button>
                        <Button variant="outline" size="sm" onClick={() => updateDeal.mutate({ deal, payload: { stage: "payment_milestones", contract_status: "spa_signed" } })}>SPA signed</Button>
                        <Button variant="outline" size="sm" onClick={() => updateDeal.mutate({ deal, payload: { stage: "handover_pending", payment_status: "received" } })}>Payment</Button>
                        <Button variant="outline" size="sm" onClick={() => updateDeal.mutate({ deal, payload: { stage: "closed", handover_status: "completed" } })}>Handover</Button>
                        <Button variant="outline" size="sm" onClick={() => raiseDispute.mutate(deal)}>Dispute</Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedDealId(deal.id); setNote(deal.notes || ""); }}>Note</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyStateCard title="No deals yet" description="Deals will appear here once reservations and sales are linked to your projects or listings." />
          )}
        </CardContent>
      </Card>

      {selectedDeal ? (
        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardHeader><CardTitle>Commercial note for {selectedDeal.deal_code || selectedDeal.id}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="developer-deal-buyer">Buyer</Label>
                <Input id="developer-deal-buyer" value={selectedDeal.buyer_name || ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label htmlFor="developer-deal-stage">Current stage</Label>
                <Input id="developer-deal-stage" value={compactLabel(selectedDeal.stage)} readOnly />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="developer-deal-note">Note</Label>
              <Textarea id="developer-deal-note" value={note} onChange={(event) => setNote(event.target.value)} className="min-h-28" placeholder="Capture a commercial note, blocker, or special condition here." />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => saveNote.mutate()} disabled={saveNote.isPending || !note.trim()}>Save note</Button>
              <Button variant="outline" onClick={() => { setSelectedDealId(""); setNote(""); }}>Close</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
