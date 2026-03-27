import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeadComparisonReviewCard({ currentLead, selectedCandidate, candidates = [] }) {
  const compareLead = candidates.find((item) => item.id === selectedCandidate) || null;

  const rows = [
    { label: "Lead code", current: currentLead?.lead_code || "—", target: compareLead?.lead_code || "—" },
    { label: "Status", current: currentLead?.status || "—", target: compareLead?.status || "—" },
    { label: "Stage", current: currentLead?.current_stage || "—", target: compareLead?.current_stage || "—" },
    { label: "Assigned partner", current: currentLead?.assigned_partner_id || "—", target: compareLead?.assigned_partner_id || "—" },
    { label: "Country", current: currentLead?.country || "—", target: compareLead?.country || "—" },
    { label: "Last touch", current: currentLead?.last_touch_at || "—", target: compareLead?.last_touch_at || "—" }
  ];

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Merge review</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {compareLead ? rows.map((row) => (
          <div key={row.label} className="grid gap-2 rounded-2xl border border-white/10 p-3 text-sm md:grid-cols-3">
            <p className="font-medium text-foreground">{row.label}</p>
            <p className="text-muted-foreground">Current: {row.current}</p>
            <p className="text-muted-foreground">Target: {row.target}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">Choose a duplicate target to compare both leads before merge.</p>}
      </CardContent>
    </Card>
  );
}