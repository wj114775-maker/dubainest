import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function UserAccessTable({ users }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Identity and access registry</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{user.legacyRole}</Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{user.status}</Badge>
              <Badge variant="secondary">{user.assignmentCount} assignments</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}