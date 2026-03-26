import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PayoutLedgerTable({ entries }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Commission ledger</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/10 p-4">
            <div>
              <p className="font-semibold">{entry.reference}</p>
              <p className="text-sm text-muted-foreground">{entry.status}</p>
            </div>
            <p className="text-lg font-semibold">AED {entry.amount.toLocaleString()}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}