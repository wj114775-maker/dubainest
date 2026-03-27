import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  { label: "Publish", value: "publish" },
  { label: "Freeze", value: "freeze" },
  { label: "Reject", value: "reject" },
  { label: "Archive", value: "archive" },
  { label: "Request correction", value: "request_correction" },
  { label: "Republish", value: "republish" }
];

export default function ListingPublicationActions({ onAction, loading }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Publication controls</CardTitle></CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <Button key={action.value} variant="outline" onClick={() => onAction(action.value)} disabled={loading}>
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}