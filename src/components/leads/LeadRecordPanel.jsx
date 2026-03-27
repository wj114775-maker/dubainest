import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadRecordPanel({ title, items, renderItem }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.id || item.label} className="rounded-2xl border border-white/10 p-4">
            {renderItem ? renderItem(item) : (
              <>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.value}</p>
              </>
            )}
          </div>
        )) : <p className="text-sm text-muted-foreground">No records yet.</p>}
      </CardContent>
    </Card>
  );
}