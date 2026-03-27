import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadTimelinePanel({ title, items = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.length ? items.map((item) => (
          <div key={item.id} className="border-l border-primary/30 pl-4">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No timeline activity yet.</p>}
      </CardContent>
    </Card>
  );
}