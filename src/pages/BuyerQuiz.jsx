import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeading from "@/components/common/SectionHeading";
import { Button } from '@/components/ui/button';
import BuyerIntentSheet from '@/components/leads/BuyerIntentSheet';

export default function BuyerQuiz() {
  const [open, setOpen] = useState(false);
  const { data: outcomes = [] } = useQuery({
    queryKey: ["buyer-quiz-outcomes"],
    queryFn: async () => {
      const [areas, listings, leads] = await Promise.all([
        base44.entities.Area.list("-updated_date", 200),
        base44.entities.Listing.filter({ status: "published" }, "-updated_date", 200),
        base44.entities.Lead.list("-updated_date", 200),
      ]);

      const saleListings = listings.filter((item) => item.listing_type !== "rent");
      const topInvestorArea = [...areas].sort((a, b) => Number(b.investor_score || 0) - Number(a.investor_score || 0))[0];
      const familyArea = [...areas].sort((a, b) => Number(b.family_score || 0) - Number(a.family_score || 0))[0];
      const privateInventoryCount = saleListings.filter((item) => item.listing_type === "private_inventory" || item.is_private_inventory).length;
      const qualifiedLeadCount = leads.filter((lead) => ["qualified", "assigned", "accepted"].includes(lead.status)).length;

      return [
        `Investor route with investment-first matching${topInvestorArea ? ` in ${topInvestorArea.name}` : ""}`,
        `Family move route with area-fit signals${familyArea ? ` led by ${familyArea.name}` : ""}`,
        `Private buyer route with ${privateInventoryCount} protected inventory options and ${qualifiedLeadCount} qualified leads`,
      ];
    },
    initialData: [],
  });

  return (
    <>
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Qualification" title="Investor, mover or private buyer?" description="This intake captures buying intent and routes the lead into the protected workflow without forcing early registration." action={<Button onClick={() => setOpen(true)}>Start qualified request</Button>} />
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="p-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            {outcomes.map((item) => <p key={item}>• {item}</p>)}
          </div>
        </CardContent>
      </Card>
    </div>
    <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="buyer_quiz" title="Buyer qualification" />
    </>
  );
}
