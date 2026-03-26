import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BuyerProfileCard({ profile }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Buyer CRM profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{profile.mode || "unclassified"}</Badge>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{profile.lifecycle_stage || "new lead"}</Badge>
          {profile.golden_visa_interest ? <Badge variant="secondary">Golden Visa</Badge> : null}
          {profile.concierge_interest ? <Badge variant="secondary">Concierge</Badge> : null}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Budget</p>
            <p className="mt-1 text-sm">{profile.budget_min ? `${profile.currency || "AED"} ${profile.budget_min.toLocaleString()} - ${profile.budget_max?.toLocaleString?.() || "open"}` : "Not captured yet"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Assigned to</p>
            <p className="mt-1 text-sm">{profile.assigned_to || "Unassigned"}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{profile.service_summary || "This buyer profile is ready for future notes, tasks and communications modules."}</p>
      </CardContent>
    </Card>
  );
}