import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function AuditFeedCard({ entries }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Recent audit trail</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[32rem] pr-4">
          <div className="space-y-3">
            {entries.length ? entries.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {entry.scope ? <Badge variant="outline">{entry.scope}</Badge> : null}
                      {entry.action ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{entry.action}</Badge> : null}
                    </div>
                    <p className="font-semibold">{entry.summary}</p>
                    {entry.reason ? <p className="text-sm text-muted-foreground">Reason: {entry.reason}</p> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.created_date ? new Date(entry.created_date).toLocaleString() : "—"}</p>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">No audit entries yet.</p>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}