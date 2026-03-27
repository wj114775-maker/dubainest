import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DuplicateReviewPanel({ candidates = [] }) {
  const orderedCandidates = [...candidates].sort((a, b) => b.confidence - a.confidence);

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Duplicate review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-dashed border-white/10 p-3 text-sm text-muted-foreground">
          Review the strongest duplicate candidates first, then use the structured lead controls to start duplicate review or complete a merge.
        </div>
        {orderedCandidates.length ? orderedCandidates.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-foreground">{item.label}</p>
              {index === 0 ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Best match</Badge> : null}
              <Badge variant="outline">Confidence {item.confidence}%</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No duplicate candidates were found for this lead.</p>}
      </CardContent>
    </Card>
  );
}