import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function ConversionSignalCard({ title, description, items = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="space-y-3 p-6">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}