import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PartnerListingsHealthCard({ listings = [] }) {
  const blocked = listings.filter((item) => ["suppressed", "frozen", "rejected"].includes(item.publication_status)).length;
  const stale = listings.filter((item) => item.freshness_status === "stale" || item.freshness_status === "expired").length;
  const missingEvidence = listings.filter((item) => item.missing_requirements?.includes("evidence")).length;

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Supply health</CardTitle></CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        <div><p className="text-sm text-muted-foreground">Publishing blocked</p><p className="mt-1 text-2xl font-semibold">{blocked}</p></div>
        <div><p className="text-sm text-muted-foreground">Needs refresh</p><p className="mt-1 text-2xl font-semibold">{stale}</p></div>
        <div><p className="text-sm text-muted-foreground">Evidence missing</p><p className="mt-1 text-2xl font-semibold">{missingEvidence}</p></div>
      </CardContent>
    </Card>
  );
}