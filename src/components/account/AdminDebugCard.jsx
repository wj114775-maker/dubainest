import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDebugCard({ data, internalFromPage }) {
  const assignments = data.assignments || [];

  return (
    <Card className="rounded-[2rem] border-dashed border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle>Admin runtime debug</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
        <div><p className="text-muted-foreground">Role</p><p className="font-medium">{data.role || "buyer"}</p></div>
        <div><p className="text-muted-foreground">Internal</p><p className="font-medium">{data.isInternal ? "Yes" : "No"}</p></div>
        <div><p className="text-muted-foreground">Page internal</p><p className="font-medium">{internalFromPage ? "Yes" : "No"}</p></div>
        <div><p className="text-muted-foreground">Permissions</p><p className="font-medium">{(data.permissions || []).length}</p></div>
        <div><p className="text-muted-foreground">Assignments</p><p className="font-medium">{assignments.length}</p></div>
        <div><p className="text-muted-foreground">Header access should show</p><p className="font-medium">{internalFromPage ? "Yes" : "No"}</p></div>
      </CardContent>
    </Card>
  );
}