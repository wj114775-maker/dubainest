import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ComplianceQueue({ items }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Compliance review queue</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{item.summary}</p>
                <p className="text-sm text-muted-foreground">{item.category} · {item.status}</p>
              </div>
              <p className="text-sm font-medium text-primary">{item.severity}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}