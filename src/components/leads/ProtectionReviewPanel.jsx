import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProtectionReviewPanel({ windows = [], alerts = [] }) {
  const activeWindow = windows.find((item) => item.status === "active");
  const expiredWindow = windows.find((item) => item.status === "expired");
  const openAlert = alerts.find((item) => ["open", "reviewing", "awaiting_partner_response", "escalated"].includes(item.status));

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Protection and alert review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="font-medium text-foreground">Protection window</p>
          <p className="mt-1 text-muted-foreground">{activeWindow ? [activeWindow.status, activeWindow.lock_reason, activeWindow.protected_until].filter(Boolean).join(" · ") : expiredWindow ? [expiredWindow.status, expiredWindow.lock_reason, expiredWindow.protected_until].filter(Boolean).join(" · ") : "No active protection window."}</p>
        </div>
        <div className="rounded-2xl border border-white/10 p-4">
          <p className="font-medium text-foreground">Circumvention case</p>
          <p className="mt-1 text-muted-foreground">{openAlert ? [openAlert.status, openAlert.severity, openAlert.summary].filter(Boolean).join(" · ") : "No active circumvention review."}</p>
        </div>
      </CardContent>
    </Card>
  );
}