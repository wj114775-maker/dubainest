import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { captureBuyerIntent } from "@/components/leads/buyerLeadActions";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

const supportLanguages = [
  { flag: "🇦🇪", label: "English" },
  { flag: "🇸🇦", label: "Arabic" },
  { flag: "🇷🇺", label: "Russian" },
  { flag: "🇨🇳", label: "Mandarin" },
];

const initialForm = {
  full_name: "",
  email: "",
  mobile: "",
  country: "",
  preferred_area: "",
  notes: "",
};

const contactHighlights = [
  "Dubai property purchase support",
  "Off-plan and project-led enquiries",
  "Private inventory and premium buyer routing",
];

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);

  const mutation = useMutation({
    mutationFn: () => captureBuyerIntent({
      ...form,
      buying_purpose: "mover",
      offplan_or_ready: "unknown",
      cash_or_mortgage: "unknown",
      notes_summary: form.notes,
      intent_type: "request_callback",
      source_channel: "web",
      source: "contact_page",
      lead_type: "buyer",
    }),
    onSuccess: () => {
      toast({ title: "Request received", description: "The team will review your message and respond through the contact details you shared." });
      setForm(initialForm);
    },
  });

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

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
        title="Contact DubaiSphere"
        description="Complete the form and the team will respond after reviewing your property requirements, project interest, or private buyer request."
        titleAs="h1"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
          <CardContent className="space-y-6 p-6 lg:p-7">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Send an enquiry</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Keep this simple. Share your details, the property focus, and anything useful for the team to review before responding.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="contact-full-name">Full name</label>
                <Input id="contact-full-name" autoComplete="name" className="h-11 rounded-[1rem] border-slate-200 bg-white" value={form.full_name} onChange={handleChange("full_name")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="contact-email">Email</label>
                <Input id="contact-email" type="email" autoComplete="email" className="h-11 rounded-[1rem] border-slate-200 bg-white" value={form.email} onChange={handleChange("email")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="contact-mobile">Mobile</label>
                <Input id="contact-mobile" type="tel" autoComplete="tel" className="h-11 rounded-[1rem] border-slate-200 bg-white" value={form.mobile} onChange={handleChange("mobile")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="contact-country">Country</label>
                <Input id="contact-country" autoComplete="country-name" className="h-11 rounded-[1rem] border-slate-200 bg-white" value={form.country} onChange={handleChange("country")} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="contact-area">Preferred area or project</label>
              <Input id="contact-area" className="h-11 rounded-[1rem] border-slate-200 bg-white" value={form.preferred_area} onChange={handleChange("preferred_area")} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="contact-notes">How can we help?</label>
              <Textarea
                id="contact-notes"
                className="min-h-[150px] rounded-[1.2rem] border-slate-200 bg-white px-4 py-3"
                value={form.notes}
                onChange={handleChange("notes")}
                placeholder="Tell us what you are looking for, your timing, and any important requirements."
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                The team will review your message and respond through the details you provide.
              </p>
              <Button
                className="h-11 rounded-full px-6"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !form.full_name || !form.email || !form.notes}
              >
                {mutation.isPending ? "Submitting..." : "Submit enquiry"}
              </Button>
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
                <h2 className="text-xl font-semibold tracking-tight text-foreground">What this form covers</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Use this single contact route for general purchase support, project questions, or a more private buyer request.
                </p>
              </div>
              <div className="space-y-3">
                {contactHighlights.map((item) => (
                  <div key={item} className="inline-flex items-start gap-3 rounded-[1.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-950" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/10 bg-card/90">
            <CardContent className="space-y-4 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-slate-950 text-white">
                <Globe2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">Support languages</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Requests can be reviewed for multilingual support where needed.
                </p>
              </div>
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
    </div>
  );
}
