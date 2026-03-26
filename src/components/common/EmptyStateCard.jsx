import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmptyStateCard({ title, description }) {
  return (
    <Card className="rounded-3xl border-dashed border-white/10 bg-card/50">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}