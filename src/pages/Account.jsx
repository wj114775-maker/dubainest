import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { base44 } from "@/api/base44Client";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import SectionHeading from "@/components/common/SectionHeading";

export default function Account() {
  const { data } = useCurrentUserRole();

  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Account" title="Sign in only when you want protected access" description="Anonymous browsing stays open; registration begins on save, compare, share, enquiry, callback, private inventory or concierge flows." />
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">Current state</p>
          <p className="text-2xl font-semibold">{data.isAuthenticated ? `Signed in as ${data.user?.full_name || data.user?.email}` : "Browsing anonymously"}</p>
          <div className="flex gap-3">
            {!data.isAuthenticated ? <Button onClick={() => base44.auth.redirectToLogin()}>Continue with sign in</Button> : <Button variant="outline" onClick={() => base44.auth.logout()}>Logout</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}