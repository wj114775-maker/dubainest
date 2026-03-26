import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function MetricCard({ label, value, hint }) {
  return (
    <Card className="rounded-3xl border-white/10 bg-card/70 shadow-xl shadow-black/5">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
        {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}