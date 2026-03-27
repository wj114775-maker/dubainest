import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";

export default function InternalLeadTable({ leads }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Lead registry</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {leads.length ? leads.map((lead) => (
          <div key={lead.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-semibold">{lead.title}</p>
              <p className="text-sm text-muted-foreground">{lead.meta}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LeadStatusBadge status={lead.status} />
              <LeadStatusBadge status={lead.ownership_status} />
              {lead.badges?.map((badge) => <LeadStatusBadge key={badge} status={badge} />)}
              <Button variant="outline" size="sm" asChild>
                <Link to={`/ops/leads/${lead.id}`}>Open</Link>
              </Button>
            </div>
          </div>
        )) : <p className="text-sm text-muted-foreground">No leads found.</p>}
      </CardContent>
    </Card>
  );
}