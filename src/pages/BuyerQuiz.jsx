import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeading from "@/components/common/SectionHeading";

export default function BuyerQuiz() {
  return (
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Qualification" title="Investor, mover or private buyer?" description="This progressive form is built to qualify intent without forcing sign-up at the start." />
      <Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="p-6 text-muted-foreground">Progressive intake for budget, goals, timeline, Golden Visa interest and concierge needs.</CardContent></Card>
    </div>
  );
}