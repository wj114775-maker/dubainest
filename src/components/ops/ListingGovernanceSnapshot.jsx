import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ListingGovernanceSnapshot({ listings = [] }) {
  const review = listings.filter((item) => ["under_review", "verification_pending", "flagged"].includes(item.status)).length;
  const frozen = listings.filter((item) => item.status === "frozen").length;
  const stale = listings.filter((item) => item.freshness_status === "stale" || item.freshness_status === "expired").length;

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Supply governance snapshot</CardTitle>
        <Button variant="outline" asChild><Link to="/ops/listings">Open listings</Link></Button>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        <div><p className="text-sm text-muted-foreground">Needs review</p><p className="mt-1 text-2xl font-semibold">{review}</p></div>
        <div><p className="text-sm text-muted-foreground">Frozen</p><p className="mt-1 text-2xl font-semibold">{frozen}</p></div>
        <div><p className="text-sm text-muted-foreground">Stale or expired</p><p className="mt-1 text-2xl font-semibold">{stale}</p></div>
      </CardContent>
    </Card>
  );
}