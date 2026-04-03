import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ActionReasonDialog from "@/components/common/ActionReasonDialog";

const reviewActions = [
  { label: "Start review", value: "under_review" },
  { label: "Confirm duplicate", value: "confirm_duplicate" },
  { label: "Dismiss duplicate", value: "dismiss" }
];

export default function ListingDuplicateReviewPanel({
  listing,
  reviews = [],
  relatedListings = {},
  loadingAction,
  onReview
}) {
  const primaryListing = relatedListings[listing.primary_listing_id] || (listing.primary_listing_id === listing.id ? listing : null);

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader className="gap-3">
        <CardTitle>Duplicate review</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Status {listing.duplicate_status || "clear"}</Badge>
          <Badge variant="outline">Risk {listing.duplicate_risk_score || 0}</Badge>
          {primaryListing ? <Badge variant="outline">Primary {primaryListing.title}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length ? (
          <>
            <ActionReasonDialog
              title="Set as primary listing"
              description="This marks the current listing as the primary record for this duplicate group."
              actionLabel="Set as primary"
              onConfirm={(reason) => onReview?.({ decision: "mark_primary", reason })}
            >
              <Button variant="outline" disabled={loadingAction === "mark_primary"}>Set this listing as primary</Button>
            </ActionReasonDialog>
            {reviews.map((item) => {
              const matchedListing = relatedListings[item.matched_listing_id];

              return (
                <div key={item.id} className="space-y-3 rounded-2xl border border-white/10 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{item.status || "candidate"}</Badge>
                    <Badge variant="outline">Confidence {item.confidence_score || 0}</Badge>
                    {item.primary_listing_id ? <Badge variant="outline">Primary {relatedListings[item.primary_listing_id]?.title || item.primary_listing_id}</Badge> : null}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{matchedListing?.title || item.matched_listing_id}</p>
                    <p>{item.decision_reason || "Awaiting operator review."}</p>
                    {matchedListing ? <Link className="text-primary underline-offset-4 hover:underline" to={`/ops/listings/${matchedListing.id}`}>Open matched listing</Link> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reviewActions.map((action) => (
                      <ActionReasonDialog
                        key={action.value}
                        title={action.label}
                        description={`This will ${action.label.toLowerCase()} for the matched listing pair.`}
                        actionLabel={action.label}
                        onConfirm={(reason) => onReview?.({ reviewId: item.id, decision: action.value, reason, matchedListingId: item.matched_listing_id })}
                      >
                        <Button variant="outline" disabled={loadingAction === item.id}>{action.label}</Button>
                      </ActionReasonDialog>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        ) : <p className="text-sm text-muted-foreground">No duplicate candidates were detected for this listing.</p>}
      </CardContent>
    </Card>
  );
}
