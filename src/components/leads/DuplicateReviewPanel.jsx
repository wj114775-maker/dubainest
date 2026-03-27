import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DuplicateReviewPanel({ candidates = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Duplicate review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {candidates.length ? candidates.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium text-foreground">{item.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">Confidence {item.confidence}%</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No duplicate candidates were found for this lead.</p>}
      </CardContent>
    </Card>
  );
}