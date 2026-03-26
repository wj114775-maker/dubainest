import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function UserOverviewCard({ title, items }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={item.label}>
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <div className="text-right">
                <p className="font-medium">{item.value || "—"}</p>
                {item.hint ? <p className="text-xs text-muted-foreground">{item.hint}</p> : null}
              </div>
            </div>
            {index < items.length - 1 ? <Separator className="mt-4" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}