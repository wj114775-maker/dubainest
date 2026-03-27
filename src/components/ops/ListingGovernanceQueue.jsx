import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ListingGovernanceQueue({ listings = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Listing review queue</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {listings.length ? listings.map((item) => (
          <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{item.title}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{item.status}</Badge>
                <Badge variant="outline">{item.trust_band || 'low'}</Badge>
                <Badge variant="outline">{item.freshness_status || 'fresh'}</Badge>
                {item.publication_status ? <Badge variant="outline">{item.publication_status}</Badge> : null}
              </div>
            </div>
            <Button variant="outline" asChild><Link to={`/ops/listings/${item.id}`}>Review listing</Link></Button>
          </div>
        )) : <p className="text-sm text-muted-foreground">No governed listings need review right now.</p>}
      </CardContent>
    </Card>
  );
}