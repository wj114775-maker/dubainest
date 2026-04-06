import React from "react";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { defaultAppConfig } from "@/lib/appShell";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

const supportLanguages = [
  { flag: "🇦🇪", label: "English" },
  { flag: "🇸🇦", label: "Arabic" },
  { flag: "🇷🇺", label: "Russian" },
  { flag: "🇨🇳", label: "Mandarin" },
];

export default function Contact() {
  const whatsappUrl = `https://wa.me/${String(defaultAppConfig.whatsapp_number || "").replace(/[^\d]/g, "")}`;

  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Contact DubaiSphere"
        description="Contact DubaiSphere for Dubai property purchase guidance, project enquiries, private inventory access, and advisory support."
        canonicalPath="/contact"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ])}
      />

      <SectionHeading
        eyebrow="Contact"
        title="Speak with the advisory team"
        description="Use WhatsApp, email, or guided enquiry routes when you want help with property search, off-plan opportunities, project pages, or private inventory access."
        titleAs="h1"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Button asChild className="rounded-full px-5">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">WhatsApp advisory</a>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-5">
                <a href={`mailto:${defaultAppConfig.support_email}`}>Email the team</a>
              </Button>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">Email:</span> {defaultAppConfig.support_email}</p>
              <p><span className="font-semibold text-foreground">WhatsApp:</span> {defaultAppConfig.whatsapp_number}</p>
              <p><span className="font-semibold text-foreground">Focus:</span> Dubai property purchase, off-plan launches, and private client handling.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-card/90">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Support languages</h2>
            <div className="flex flex-wrap gap-2">
              {supportLanguages.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700">
                  <span aria-hidden="true">{item.flag}</span>
                  {item.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
