import React, { useMemo, useState } from "react";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compactLabel, formatCurrency } from "@/lib/revenue";

const filters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "reservation_pending", label: "Reservation pending" },
  { value: "contract_pending", label: "Contract pending" },
  { value: "payment_milestones", label: "Payment milestones" },
  { value: "handover_pending", label: "Handover pending" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function DeveloperDealsTab({
  deals = [],
  organisations = [],
  projects = [],
  listings = [],
  loading = false,
  onAction,
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredDeals = useMemo(() => (
    activeFilter === "all"
      ? deals
      : deals.filter((deal) => deal.stage === activeFilter)
  ), [activeFilter, deals]);

  const counts = useMemo(() => filters.reduce((accumulator, filter) => {
    accumulator[filter.value] = filter.value === "all"
      ? deals.length
      : deals.filter((deal) => deal.stage === filter.value).length;
    return accumulator;
  }, {}), [deals]);

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle>Deal and handover desk</CardTitle>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use dedicated stage views to manage reservation, SPA, payment, and handover progression for developer-linked deals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <Button key={filter.value} variant={activeFilter === filter.value ? "default" : "outline"} size="sm" onClick={() => setActiveFilter(filter.value)}>
              {filter.label} ({counts[filter.value] || 0})
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredDeals.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal code</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Broker / agency</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Reservation</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Handover</TableHead>
                <TableHead>Sale price</TableHead>
                <TableHead>Platform fee</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => {
                const organisation = organisations.find((item) => item.id === deal.developer_organisation_id);
                return (
                  <TableRow key={deal.id}>
                    <TableCell>{deal.deal_code || deal.id}</TableCell>
                    <TableCell>{deal.buyer_name || "Buyer"}</TableCell>
                    <TableCell>{listings.find((item) => item.id === deal.listing_id)?.title || deal.listing_id || "—"}</TableCell>
                    <TableCell>{projects.find((item) => item.id === deal.project_id)?.name || deal.project_id || "—"}</TableCell>
                    <TableCell>{organisation?.trading_name || organisation?.legal_name || "—"}</TableCell>
                    <TableCell>{[deal.assigned_broker_id, deal.assigned_partner_id].filter(Boolean).join(" / ") || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(deal.stage)}</Badge></TableCell>
                    <TableCell>{compactLabel(deal.reservation_status)}</TableCell>
                    <TableCell>{compactLabel(deal.contract_status)}</TableCell>
                    <TableCell>{compactLabel(deal.payment_status)}</TableCell>
                    <TableCell>{compactLabel(deal.handover_status)}</TableCell>
                    <TableCell>{formatCurrency(deal.sale_price || 0)}</TableCell>
                    <TableCell>{formatCurrency(deal.expected_platform_fee || 0)}</TableCell>
                    <TableCell>{formatCurrency(deal.expected_commission || 0)}</TableCell>
                    <TableCell>{formatDateTime(deal.updated_date || deal.created_date)}</TableCell>
                    <TableCell>
                      {onAction ? (
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" onClick={() => onAction(deal, "reservation_received")} disabled={loading}>Reservation</Button>
                          <Button variant="outline" size="sm" onClick={() => onAction(deal, "spa_sent")} disabled={loading}>SPA sent</Button>
                          <Button variant="outline" size="sm" onClick={() => onAction(deal, "spa_signed")} disabled={loading}>SPA signed</Button>
                          <Button variant="outline" size="sm" onClick={() => onAction(deal, "milestone_received")} disabled={loading}>Milestone</Button>
                          <Button variant="outline" size="sm" onClick={() => onAction(deal, "handover_scheduled")} disabled={loading}>Schedule handover</Button>
                          <Button variant="outline" size="sm" onClick={() => onAction(deal, "handover_completed")} disabled={loading}>Complete handover</Button>
                        </div>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyStateCard title="No developer deals yet" description="Deals linked to signed developers will appear here." />
        )}
      </CardContent>
    </Card>
  );
}
