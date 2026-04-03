import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import SectionHeading from "@/components/common/SectionHeading";
import BuyerProfileCard from "@/components/account/BuyerProfileCard";
import AdminShortcutsCard from "@/components/account/AdminShortcutsCard";
import AdminDebugCard from "@/components/account/AdminDebugCard";
import { roleGroups } from "@/lib/appShell";

export default function Account() {
  const { data } = useCurrentUserRole();
  const isInternal = roleGroups.internal.includes(data.role) || (data.permissions || []).length > 0;
  const loginTarget = typeof window !== "undefined" ? new URL("/workspace", window.location.origin).toString() : "/workspace";
  const { data: profile } = useQuery({
    queryKey: ["buyer-profile", data.user?.id],
    enabled: !!data.user?.id,
    queryFn: async () => {
      const profiles = await base44.entities.BuyerProfile.filter({ user_id: data.user.id });
      return profiles[0] || {
        mode: "investor",
        lifecycle_stage: "new lead",
        currency: "AED",
        concierge_interest: false,
        golden_visa_interest: false
      };
    },
    initialData: {
      mode: "investor",
      lifecycle_stage: "new lead",
      currency: "AED",
      concierge_interest: false,
      golden_visa_interest: false
    }
  });

  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow={isInternal ? "Admin account" : "Account"} title={isInternal ? "Your internal workspace access is active" : "Sign in only when you want protected access"} description={isInternal ? "Use this page as the handoff into Internal OS, lead operations, user controls and audit tools." : "Anonymous browsing stays open; registration begins on save, compare, share, enquiry, callback, private inventory or concierge flows."} />
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">Current state</p>
          <p className="text-2xl font-semibold">{data.isAuthenticated ? `Signed in as ${data.user?.full_name || data.user?.email}` : "Browsing anonymously"}</p>
          <div className="flex gap-3">
            {!data.isAuthenticated ? <Button onClick={() => base44.auth.redirectToLogin(loginTarget)}>Continue with sign in</Button> : <Button variant="outline" onClick={() => base44.auth.logout()}>Logout</Button>}
          </div>
        </CardContent>
      </Card>
      {isInternal ? (
        <>
          <Card className="rounded-[2rem] border-primary/15 bg-primary/5 shadow-lg shadow-primary/5">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">Internal access active</Badge>
                <Badge variant="outline" className="rounded-full">Role {data.role || "admin"}</Badge>
              </div>
              <CardTitle className="text-2xl">Open the workspace, not just the account page</CardTitle>
              <CardDescription>
                Your Google account is signed in correctly. Use the workspace launcher below to reach the operational backend directly.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-full px-5">
                <Link to="/workspace">Open workspace</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to="/ops/leads">Open buyers desk</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to="/ops/admin">Open control center</Link>
              </Button>
            </CardContent>
          </Card>
          <AdminShortcutsCard />
          <details className="rounded-[2rem] border border-dashed border-primary/25 bg-card/70 p-5">
            <summary className="cursor-pointer text-sm font-medium text-foreground">Show technical runtime details</summary>
            <div className="mt-4">
              <AdminDebugCard data={data} internalFromPage={isInternal} />
            </div>
          </details>
        </>
      ) : null}
      {data.isAuthenticated ? <BuyerProfileCard profile={profile} /> : null}
    </div>
  );
}
