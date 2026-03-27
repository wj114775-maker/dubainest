import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadEvidencePanel({ alerts = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Evidence log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length ? alerts.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 p-4">
            <p className="font-medium text-foreground">{item.summary || item.alert_type || "Alert evidence"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{[item.status, item.severity, item.evidence_json?.evidence_note].filter(Boolean).join(" · ") || "No evidence details recorded."}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No evidence records yet.</p>}
      </CardContent>
    </Card>
  );
}