import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LeadRuleEvaluationPanel({ items = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Runtime rule evaluations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-foreground">{item.ruleLabel}</p>
              <Badge variant={item.matched ? "default" : "outline"}>{item.matched ? "Matched" : "Observed"}</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.trigger}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No runtime rule history yet.</p>}
      </CardContent>
    </Card>
  );
}