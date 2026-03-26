import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserLifecycleActionsCard from "@/components/admin/UserLifecycleActionsCard";

export default function SecurityActionPanel({ selectedUser, onAction }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Direct security actions</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedUser ? (
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedUser.name}</p>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-background/50 p-4">
              <UserLifecycleActionsCard securityState={selectedUser} onAction={onAction} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a user from the security states table to run a security action.</p>
        )}
      </CardContent>
    </Card>
  );
}