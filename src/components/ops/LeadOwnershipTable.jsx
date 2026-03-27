import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LeadActionBar from "@/components/leads/LeadActionBar";

export default function LeadOwnershipTable({ leads, getActions }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Lead ownership and anti-circumvention</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {leads.length ? leads.map((lead) => (
          <div key={lead.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{lead.summary}</p>
              <p className="text-sm text-muted-foreground">Fingerprint: {lead.fingerprint}</p>
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{lead.status}</Badge>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{lead.ownership_status}</Badge>
                {lead.anti_circumvention_flag ? <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">Protected</Badge> : null}
              </div>
              <LeadActionBar actions={getActions ? getActions(lead) : []} />
            </div>
          </div>
        )) : <p className="text-sm text-muted-foreground">No leads found yet.</p>}
      </CardContent>
    </Card>
  );
}