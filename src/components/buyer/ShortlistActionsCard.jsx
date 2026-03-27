import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ShortlistActionsCard({ onShare, onConsult }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Turn your shortlist into action</h3>
          <p className="text-sm text-muted-foreground">Share it or request a protected consultation.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onShare}>Generate share link</Button>
          <Button onClick={onConsult}>Request consultation</Button>
        </div>
      </CardContent>
    </Card>
  );
}