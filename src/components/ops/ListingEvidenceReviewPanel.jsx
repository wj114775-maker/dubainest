import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ActionReasonDialog from "@/components/common/ActionReasonDialog";

const reviewActions = [
  { label: "Accept", value: "accept" },
  { label: "Needs more info", value: "needs_more_info" },
  { label: "Reject", value: "reject" }
];

export default function ListingEvidenceReviewPanel({ evidence = [], loadingAction, onReview }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Evidence review</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {evidence.length ? evidence.map((item) => (
          <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{item.evidence_type}</Badge>
              <Badge variant="outline">{item.status || "submitted"}</Badge>
              {item.reviewed_at ? <Badge variant="outline">Reviewed {new Date(item.reviewed_at).toLocaleDateString()}</Badge> : null}
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>{item.notes || "No notes provided."}</p>
              {item.file_url ? <a className="text-primary underline-offset-4 hover:underline" href={item.file_url} target="_blank" rel="noreferrer">Open evidence</a> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {reviewActions.map((action) => (
                <ActionReasonDialog
                  key={action.value}
                  title={action.label}
                  description={`This will mark the evidence as ${action.label.toLowerCase()}.`}
                  actionLabel={action.label}
                  onConfirm={(reason) => onReview?.({ evidenceId: item.id, decision: action.value, reason })}
                >
                  <Button variant="outline" disabled={loadingAction === item.id}>
                    {action.label}
                  </Button>
                </ActionReasonDialog>
              ))}
            </div>
          </div>
        )) : <p className="text-sm text-muted-foreground">No evidence submitted yet.</p>}
      </CardContent>
    </Card>
  );
}
