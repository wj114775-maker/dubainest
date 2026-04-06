import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Card, CardContent } from "@/components/ui/card";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

export default function Privacy() {
  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Privacy Policy"
        description="Read how DubaiSphere handles buyer enquiries, account data, and advisory contact information."
        canonicalPath="/privacy"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ])}
      />

      <SectionHeading
        eyebrow="Privacy"
        title="How DubaiSphere handles your information"
        description="Buyer data is used to support property search, shortlist creation, enquiry handling, and purchase advisory workflows."
        titleAs="h1"
      />

      <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
        <CardContent className="space-y-4 p-6 text-sm leading-7 text-muted-foreground">
          <p>We collect information you provide when you enquire, request a shortlist, ask for a callback, request private inventory access, or open an account.</p>
          <p>We use that information to respond to your request, support property purchase workflows, and manage any linked advisory, developer, or concierge process.</p>
          <p>We do not position the site as an open public posting marketplace. Internal teams manage listings, projects, and developer records before they are shown publicly.</p>
        </CardContent>
      </Card>
    </div>
  );
}
