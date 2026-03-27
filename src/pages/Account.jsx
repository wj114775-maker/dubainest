import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
            {!data.isAuthenticated ? <Button onClick={() => base44.auth.redirectToLogin()}>Continue with sign in</Button> : <Button variant="outline" onClick={() => base44.auth.logout()}>Logout</Button>}
          </div>
        </CardContent>
      </Card>
      {isInternal ? <><AdminDebugCard data={data} internalFromPage={isInternal} /><AdminShortcutsCard /></> : null}
      {data.isAuthenticated ? <BuyerProfileCard profile={profile} /> : null}
    </div>
  );
}