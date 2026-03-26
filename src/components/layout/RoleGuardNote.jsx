import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function RoleGuardNote({ title }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold tracking-tight">Restricted workspace</h2>
        <p className="mt-2 text-sm text-muted-foreground">Sign in with the correct enterprise role to access {title}.</p>
      </CardContent>
    </Card>
  );
}