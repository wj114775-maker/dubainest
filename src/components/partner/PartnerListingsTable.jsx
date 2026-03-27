import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TrustBadge from "@/components/common/TrustBadge";

export default function PartnerListingsTable({ listings }) {
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
                <Badge variant="outline">Permit {listing.permit_verified ? "verified" : "pending"}</Badge>
                {listing.is_private_inventory ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Private inventory</Badge> : null}
              </div>
            </div>
            <TrustBadge score={listing.trust_score} />
          </div>
        )) : <p className="text-sm text-muted-foreground">No listings found yet.</p>}
      </CardContent>
    </Card>
  );
}