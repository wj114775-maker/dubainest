import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActionReasonDialog from "@/components/common/ActionReasonDialog";

const actions = [
  { label: "Publish", value: "publish" },
  { label: "Unpublish", value: "unpublish" },
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
          <ActionReasonDialog
            key={action.value}
            title={action.label}
            description={`This will ${action.label.toLowerCase()} the listing and write a decision record.`}
            actionLabel={action.label}
            onConfirm={(reason) => onAction({ decisionType: action.value, reason })}
          >
            <Button variant="outline" disabled={loading}>
              {action.label}
            </Button>
          </ActionReasonDialog>
        ))}
      </CardContent>
    </Card>
  );
}
