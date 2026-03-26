import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function getInitials(name, email) {
  const source = name || email || "U";
  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function UserProfileHeader({ user, securityState, assignmentCount, membershipCount, noteCount, flagCount }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarFallback className="text-lg font-semibold">{getInitials(user?.full_name, user?.email)}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">{user?.full_name || user?.email}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Legacy role: {user?.role || "buyer"}</Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{securityState?.security_status || "normal"}</Badge>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">Assignments</p>
            <p className="text-xl font-semibold">{assignmentCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">Memberships</p>
            <p className="text-xl font-semibold">{membershipCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">Notes</p>
            <p className="text-xl font-semibold">{noteCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 px-4 py-3">
            <p className="text-xs text-muted-foreground">Flags</p>
            <p className="text-xl font-semibold">{flagCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}