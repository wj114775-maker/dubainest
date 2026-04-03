import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TrustBadge from "@/components/common/TrustBadge";
import PartnerListingActionBar from "@/components/partner/PartnerListingActionBar";

export default function PartnerListingsTable({ listings, onEvaluate, evaluatingId, onAction, onEdit, onRespond, onEvidence, actionLoading }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Permit-aware listing control</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {listings.length ? listings.map((listing) => (
          <div key={listing.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{listing.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{listing.status}</Badge>
                <Badge variant="outline">Verification {listing.verification_status || 'pending'}</Badge>
                <Badge variant="outline">Trust {listing.trust_band || 'low'}</Badge>
                <Badge variant="outline">Freshness {listing.freshness_status || 'fresh'}</Badge>
                <Badge variant="outline">Permit {listing.permit_verified ? "verified" : "pending"}</Badge>
                {listing.publication_status ? <Badge variant="outline">{listing.publication_status}</Badge> : null}
                {listing.is_private_inventory ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Private inventory</Badge> : null}
              </div>
              {listing.missing_requirements?.length ? <p className="mt-2 text-sm text-muted-foreground">Missing: {listing.missing_requirements.join(', ')}</p> : null}
              {listing.open_issue_codes?.length ? <p className="mt-1 text-sm text-muted-foreground">Open issues: {listing.open_issue_codes.join(', ')}</p> : null}
            </div>
            <div className="flex flex-col items-stretch gap-3 md:items-end">
              <div className="flex items-center gap-3">
                <TrustBadge score={listing.trust_score} />
                <Button variant="outline" onClick={() => onEvaluate?.(listing.id)} disabled={evaluatingId === listing.id}>Refresh readiness</Button>
              </div>
              <PartnerListingActionBar
                listing={listing}
                onSubmit={onAction}
                onEdit={onEdit}
                onRespond={onRespond}
                onEvidence={onEvidence}
                loading={actionLoading === listing.id}
              />
            </div>
          </div>
        )) : <p className="text-sm text-muted-foreground">No listings found yet.</p>}
      </CardContent>
    </Card>
  );
}
