import React from "react";
import { Link } from "react-router-dom";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compactLabel, formatCurrency } from "@/lib/revenue";

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function BuyerMatchingPanel({
  title = "Buyer matching",
  description = "Review which buyer records are already touching this scope through enquiries, viewings, or live deals.",
  summary,
}) {
  const budgetRangeLabel = summary?.budgetFloor && summary?.budgetCeiling
    ? `${formatCurrency(summary.budgetFloor)} to ${formatCurrency(summary.budgetCeiling)}`
    : summary?.budgetCeiling
      ? `Up to ${formatCurrency(summary.budgetCeiling)}`
      : summary?.budgetFloor
        ? `From ${formatCurrency(summary.budgetFloor)}`
        : "Not enough budget data yet";

  if (!summary?.matches?.length) {
    return <EmptyStateCard title="No buyer matches yet" description="Buyer enquiries, matched leads, and viewing activity will appear here once linked to this scope." />;
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Matched buyers</p><p className="mt-2 text-2xl font-semibold">{summary.totalMatches}</p></div>
          <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Active</p><p className="mt-2 text-2xl font-semibold">{summary.activeMatches}</p></div>
          <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Premium</p><p className="mt-2 text-2xl font-semibold">{summary.premiumMatches}</p></div>
          <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Protected</p><p className="mt-2 text-2xl font-semibold">{summary.protectedMatches}</p></div>
          <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Viewings</p><p className="mt-2 text-2xl font-semibold">{summary.withViewings}</p></div>
          <div className="rounded-2xl border border-white/10 p-4"><p className="text-sm text-muted-foreground">Open deals</p><p className="mt-2 text-2xl font-semibold">{summary.openDeals}</p></div>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Matching snapshot</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Budget range: <span className="text-foreground">{budgetRangeLabel}</span></p>
          <p>Top intents: <span className="text-foreground">{summary.topIntents.length ? summary.topIntents.map((item) => `${compactLabel(item.label)} (${item.count})`).join(" · ") : "No intent signals yet"}</span></p>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Matched buyer records</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Match reason</TableHead>
                <TableHead>Intent</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Pipeline</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Last touch</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{match.displayName}</p>
                      <p className="text-xs text-muted-foreground">{match.lead.lead_code || match.id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {match.reasons.map((reason) => <Badge key={reason} variant="outline">{compactLabel(reason)}</Badge>)}
                      {match.isPremium ? <Badge variant="outline">Premium</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>{match.intentLabel || "Buyer inquiry"}</TableCell>
                  <TableCell>{match.budgetLabel}</TableCell>
                  <TableCell>{[compactLabel(match.lead.current_stage || match.lead.status || "new"), compactLabel(match.lead.ownership_status || "unowned")].join(" · ")}</TableCell>
                  <TableCell>{match.ownerLabel}</TableCell>
                  <TableCell>{formatDateTime(match.latestActivityAt)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/ops/leads/${match.id}`} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                      Open lead
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
