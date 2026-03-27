import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RuleOutcomeFeedCard({ items = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Recent rule outcomes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No recent rule outcomes yet.</p>}
      </CardContent>
    </Card>
  );
}