import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CompareActionsCard({ onConsult }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Need help choosing?</h3>
          <p className="text-sm text-muted-foreground">Convert this compare set into a guided consultation.</p>
        </div>
        <Button onClick={onConsult}>Book comparison consult</Button>
      </CardContent>
    </Card>
  );
}