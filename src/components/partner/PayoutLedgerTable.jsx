import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PayoutLedgerTable({ entries }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Commission ledger</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {entries.length ? entries.map((entry) => (
          <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{entry.reference}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                <Badge variant="outline">{entry.status}</Badge>
              </div>
            </div>
            <p className="text-lg font-semibold">AED {entry.amount.toLocaleString()}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No payout entries found yet.</p>}
      </CardContent>
    </Card>
  );
}