import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InternalMergeImpactCard() {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Merge consolidation scope</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <p>The surviving target lead will inherit and consolidate linked records from the source lead.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Lead identities</li>
          <li>Lead attribution records</li>
          <li>Lead assignments</li>
          <li>Lead notes summary</li>
          <li>Contact attempts</li>
          <li>Circumvention alerts</li>
          <li>Protection windows</li>
          <li>Viewings</li>
        </ul>
        <p className="pt-2">The target keeps the strongest priority, latest touch date, and resolved partner ownership, while the source lead is closed as merged and released from active ownership.</p>
      </CardContent>
    </Card>
  );
}