import React from "react";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compactLabel, formatCurrency } from "@/lib/revenue";

export default function DeveloperDealsTab({ deals = [], organisations = [], projects = [], listings = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Deal and handover desk</CardTitle></CardHeader>
      <CardContent>
        {deals.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal code</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Listing</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Developer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Reservation</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Handover</TableHead>
                <TableHead>Sale price</TableHead>
                <TableHead>Platform fee</TableHead>
                <TableHead>Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => {
                const organisation = organisations.find((item) => item.id === deal.developer_organisation_id);
                return (
                  <TableRow key={deal.id}>
                    <TableCell>{deal.deal_code || deal.id}</TableCell>
                    <TableCell>{deal.buyer_name || "Buyer"}</TableCell>
                    <TableCell>{listings.find((item) => item.id === deal.listing_id)?.title || deal.listing_id || "—"}</TableCell>
                    <TableCell>{projects.find((item) => item.id === deal.project_id)?.name || deal.project_id || "—"}</TableCell>
                    <TableCell>{organisation?.trading_name || organisation?.legal_name || "—"}</TableCell>
                    <TableCell><Badge variant="outline">{compactLabel(deal.stage)}</Badge></TableCell>
                    <TableCell>{compactLabel(deal.reservation_status)}</TableCell>
                    <TableCell>{compactLabel(deal.contract_status)}</TableCell>
                    <TableCell>{compactLabel(deal.payment_status)}</TableCell>
                    <TableCell>{compactLabel(deal.handover_status)}</TableCell>
                    <TableCell>{formatCurrency(deal.sale_price || 0)}</TableCell>
                    <TableCell>{formatCurrency(deal.expected_platform_fee || 0)}</TableCell>
                    <TableCell>{formatCurrency(deal.expected_commission || 0)}</TableCell>
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
