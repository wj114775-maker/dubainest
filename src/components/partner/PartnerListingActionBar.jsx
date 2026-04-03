import React from "react";
import { Button } from "@/components/ui/button";

export default function PartnerListingActionBar({ listing, onSubmit, onEdit, onRespond, onEvidence, loading }) {
  const needsResponse = ["suppressed", "frozen", "rejected"].includes(listing.publication_status) || ["under_review", "verification_pending", "flagged"].includes(listing.status) || Boolean(listing.missing_requirements?.length);

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={() => onEdit?.(listing)} disabled={loading}>Edit listing</Button>
      <Button variant="outline" onClick={() => onSubmit?.(listing, "refresh")} disabled={loading}>Refresh listing</Button>
      <Button variant="outline" onClick={() => onSubmit?.(listing, "submit")} disabled={loading}>Submit update</Button>
      <Button variant="outline" onClick={() => onEvidence?.(listing)} disabled={loading}>Upload evidence</Button>
      {needsResponse ? <Button variant="outline" onClick={() => onRespond?.(listing)} disabled={loading}>Respond to review</Button> : null}
      <Button onClick={() => onSubmit?.(listing, "republish")} disabled={loading}>Request republish</Button>
    </div>
  );
}
