import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function GuideCard({ guide }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">{guide.category}</p>
        <h3 className="text-xl font-semibold tracking-tight">{guide.title}</h3>
        <p className="text-sm text-muted-foreground">{guide.excerpt}</p>
      </CardContent>
    </Card>
  );
}