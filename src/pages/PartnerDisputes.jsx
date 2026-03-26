import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useCurrentUserRole from "@/hooks/useCurrentUserRole";

export default function PartnerDisputes() {
  const { data: current } = useCurrentUserRole();

  const { data: disputes = [] } = useQuery({
    queryKey: ["partner-disputes", current.user?.id],
    enabled: !!current.user?.id,
    queryFn: async () => {
      const [profiles, disputesData] = await Promise.all([
        base44.entities.PartnerUserProfile.filter({ user_id: current.user.id }),
        base44.entities.Dispute.list("-updated_date", 200),
      ]);

      const partnerAgencyId = profiles[0]?.partner_agency_id;
      return disputesData.filter((item) => item.partner_agency_id === partnerAgencyId);
    },
    initialData: [],
  });

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Disputes" title="Ownership and payout disputes under formal workflow" description="This layer is reserved for evidence-backed escalation and internal resolution paths." />
      {disputes.length ? (
        <Card className="rounded-[2rem] border-white/10 bg-card/80">
          <CardHeader><CardTitle>Open dispute registry</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {disputes.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 p-4">
                <p className="font-semibold">{item.summary}</p>
                <p className="text-sm text-muted-foreground">{item.category} · {item.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : <EmptyStateCard title="No disputes yet" description="Any ownership or payout dispute for this partner will appear here." />}
    </div>
  );
}