import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminSummaryStrip({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="rounded-[2rem] border-white/10 bg-card/80">
          <CardContent className="space-y-1 p-5">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-2xl font-semibold">{item.value}</p>
            {item.hint ? <p className="text-xs text-muted-foreground">{item.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}