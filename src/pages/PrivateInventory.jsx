import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

const benefits = [
  "Private buyer intake before restricted stock is shared",
  "Curated handling for discreet inventory and premium routes",
  "Governed progression into NDA and concierge workflows where needed",
];

export default function PrivateInventory() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-6 pb-28">
        <SeoMeta
          title="Private Inventory Property Access"
          description="Request private inventory access through a governed enquiry route for premium and discreet property opportunities."
          canonicalPath="/private-inventory"
          jsonLd={buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Private Inventory", path: "/private-inventory" },
          ])}
        />

        <SectionHeading
          eyebrow="Private inventory"
          title="Request access to private inventory through a governed buyer route"
          description="Use this page when the buyer should move into a more discreet workflow instead of browsing everything through the open property directory."
          titleAs="h1"
          action={(
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="rounded-full px-5" onClick={() => setOpen(true)}>
                Request access
              </Button>
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to="/properties?privateInventory=1">Open published private listings</Link>
              </Button>
            </div>
          )}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
            <CardContent className="space-y-5 p-6 lg:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-slate-950 text-white">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">A cleaner private-client entry point</h2>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  This page exists as a proper public landing page for SEO and buyer flow. It gives you a controlled route into restricted opportunities without exposing the whole experience as a generic filter result.
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((item) => (
                  <div key={item} className="inline-flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-950" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-[2rem] border-white/10 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-slate-950 text-white">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">Why this page matters</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Public pages should explain the route first. Restricted inventory should be requested, not treated like a standard search result.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-white/10 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-slate-950 text-white">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">What happens next</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Once requested, the enquiry can move into a higher-control workflow instead of staying in the open listing path.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="request_private_inventory" title="Request private inventory access" />
    </>
  );
}
