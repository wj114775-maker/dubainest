import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminInviteUserCard({ onInvite }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Invite user</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" />
        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (user or admin)" />
        <Button onClick={() => onInvite({ email, role })}>Send invite</Button>
      </CardContent>
    </Card>
  );
}