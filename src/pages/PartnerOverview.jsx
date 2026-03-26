import React from "react";
import { useQuery } from "@tanstack/react-query";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import PartnerProfileCard from "@/components/partner/PartnerProfileCard";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";
import { base44 } from "@/api/base44Client";

export default function PartnerOverview() {
  const { data } = useCurrentUserRole();
  const { data: profile } = useQuery({
    queryKey: ["partner-profile", data.user?.id],
    enabled: !!data.user?.id,
    queryFn: async () => {
      const profiles = await base44.entities.PartnerUserProfile.filter({ user_id: data.user.id });
      return profiles[0] || { membership_type: "broker", status: "active" };
    },
    initialData: { membership_type: "broker", status: "active" }
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Partner OS" title="Execution workspace for licensed agencies" description="Partners operate lead response, listing readiness, deal progress and payouts inside controlled rules set by the platform." />
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Open leads" value="38" />
        <MetricCard label="Median response" value="12 min" />
        <MetricCard label="Active listings" value="114" />
        <MetricCard label="Disputes" value="3" />
      </div>
      <PartnerProfileCard profile={profile} />
    </div>
  );
}