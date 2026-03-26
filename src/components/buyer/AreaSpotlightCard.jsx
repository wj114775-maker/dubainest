import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function AreaSpotlightCard({ area }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-card/80">
      <div className="aspect-[4/3] bg-muted">
        <img src={area.hero_image_url} alt={area.name} className="h-full w-full object-cover" />
      </div>
      <CardContent className="space-y-3 p-5">
        <h3 className="text-xl font-semibold tracking-tight">{area.name}</h3>
        <p className="text-sm text-muted-foreground">{area.description}</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><p className="text-muted-foreground">Yield</p><p className="font-semibold">{area.avg_rental_yield}%</p></div>
          <div><p className="text-muted-foreground">Family</p><p className="font-semibold">{area.family_score}/100</p></div>
          <div><p className="text-muted-foreground">Investor</p><p className="font-semibold">{area.investor_score}/100</p></div>
        </div>
      </CardContent>
    </Card>
  );
}