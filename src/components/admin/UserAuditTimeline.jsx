import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function UserAuditTimeline({ items }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[22rem] pr-4">
          <div className="space-y-4">
            {items.length ? items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">{item.summary}</p>
                    <p className="text-xs text-muted-foreground">{item.action || item.event_type || "activity"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.created_date ? new Date(item.created_date).toLocaleString() : "—"}</p>
                </div>
                {item.reason ? <p className="mt-2 text-sm text-muted-foreground">Reason: {item.reason}</p> : null}
              </div>
            )) : <p className="text-sm text-muted-foreground">No audit entries yet.</p>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}