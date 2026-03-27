import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadResolutionSummaryCard({ lead, latestAssignment, latestAlert, latestWindow }) {
  const items = [
    { label: "Latest assignment", value: latestAssignment ? [latestAssignment.assignment_status, latestAssignment.partner_id, latestAssignment.sla_due_at].filter(Boolean).join(" · ") : "No assignment yet." },
    { label: "Protection state", value: latestWindow ? [latestWindow.status, latestWindow.lock_reason, latestWindow.protected_until].filter(Boolean).join(" · ") : lead?.ownership_status || "unowned" },
    { label: "Alert state", value: latestAlert ? [latestAlert.status, latestAlert.severity, latestAlert.summary].filter(Boolean).join(" · ") : "No active alert." }
  ];

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Resolution summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium text-foreground">{item.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}