import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ComplianceCaseCard({ item }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold">{item.summary}</p>
            <p className="text-sm text-muted-foreground">Owner: {item.assigned_reviewer_id || "Unassigned"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{item.category}</Badge>
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{item.status}</Badge>
            {item.freeze_active ? <Badge variant="destructive">Freeze active</Badge> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}