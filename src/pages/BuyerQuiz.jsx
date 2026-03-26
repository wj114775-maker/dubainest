import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeading from "@/components/common/SectionHeading";
import { Button } from '@/components/ui/button';
import BuyerIntentSheet from '@/components/leads/BuyerIntentSheet';

const quizOutcomes = [
  'Investor route with yield-first inventory matching',
  'Family move route with area-fit and school proximity signals',
  'Private buyer route with protected callback and concierge support',
];

export default function BuyerQuiz() {
  const [open, setOpen] = useState(false);
  return (
    <>
    <div className="space-y-6 pb-28">
      <SectionHeading eyebrow="Qualification" title="Investor, mover or private buyer?" description="This intake captures buying intent and routes the lead into the protected workflow without forcing early registration." actions={<Button onClick={() => setOpen(true)}>Start qualified request</Button>} />
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardContent className="p-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            {quizOutcomes.map((item) => <p key={item}>• {item}</p>)}
          </div>
        </CardContent>
      </Card>
    </div>
    <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="buyer_quiz" title="Buyer qualification" />
    </>
  );
}