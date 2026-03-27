import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DuplicateQueueCard({ items = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Duplicate review queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to={`/ops/leads/${item.id}`}>Review</Link>
            </Button>
          </div>
        )) : <p className="text-sm text-muted-foreground">No duplicate candidates waiting.</p>}
      </CardContent>
    </Card>
  );
}