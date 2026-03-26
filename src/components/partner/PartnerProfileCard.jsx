import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PartnerProfileCard({ profile }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Partner membership profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{profile.membership_type || "member"}</Badge>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{profile.status || "invited"}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Title</p>
            <p className="mt-1 text-sm">{profile.title || "Not set"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Assigned owner</p>
            <p className="mt-1 text-sm">{profile.assigned_to || "Unassigned"}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{profile.internal_notes || "Partner-side CRM fields are now ready for notes, workflow ownership and account flags."}</p>
      </CardContent>
    </Card>
  );
}