import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SectionHeading from "@/components/common/SectionHeading";

const entries = [
  { id: "1", event: "Listing publish blocked", detail: "Permit evidence missing for LIST-1023" },
  { id: "2", event: "Lead ownership locked", detail: "Lead DXB-88312 assigned to partner agency" },
  { id: "3", event: "Commission status changed", detail: "LEDGER-9112 moved to disputed" }
];

export default function OpsAudit() {
  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Audit" title="Immutable event history across leads, payouts and controls" description="Audit visibility is core to enterprise trust, investigation and partner governance." />
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Recent audit trail</CardTitle></CardHeader>
        <CardContent className="space-y-3">{entries.map((entry) => <div key={entry.id} className="rounded-2xl border border-white/10 p-4"><p className="font-semibold">{entry.event}</p><p className="text-sm text-muted-foreground">{entry.detail}</p></div>)}</CardContent>
      </Card>
    </div>
  );
}