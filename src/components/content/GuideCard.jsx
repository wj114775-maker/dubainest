import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GuideCard({ guide }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="space-y-3 p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-primary">{guide.category}</p>
        <h3 className="text-xl font-semibold tracking-tight">{guide.title}</h3>
        <p className="text-sm text-muted-foreground">{guide.excerpt}</p>
        <div className="rounded-2xl bg-muted/70 p-4 text-sm text-muted-foreground line-clamp-4">{guide.body}</div>
        <Button variant="outline" className="w-full rounded-2xl">Read guide</Button>
      </CardContent>
    </Card>
  );
}