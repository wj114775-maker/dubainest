import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RuleTable({ title, items }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{item.type}</Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{item.status}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}