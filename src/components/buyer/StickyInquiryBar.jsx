import React from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, PhoneCall, ShieldCheck } from "lucide-react";

export default function StickyInquiryBar() {
  return (
    <div className="fixed bottom-20 left-4 right-4 z-30 rounded-[1.75rem] border border-white/10 bg-background/90 p-3 shadow-2xl shadow-black/15 backdrop-blur md:bottom-6 md:left-auto md:right-6 md:w-[420px]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Unlock guided next steps</p>
          <p className="text-xs text-muted-foreground"><ShieldCheck className="mr-1 inline h-3 w-3 text-primary" /> Registration only starts when you request action.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-2xl"><PhoneCall className="mr-2 h-4 w-4" /> Callback</Button>
          <Button className="rounded-2xl"><MessageCircle className="mr-2 h-4 w-4" /> Enquire</Button>
        </div>
      </div>
    </div>
  );
}