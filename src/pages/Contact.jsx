import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Globe2, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { captureBuyerIntent } from "@/components/leads/buyerLeadActions";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { verifyRecaptchaAction } from "@/lib/recaptcha";
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
  phone: "",
  subject: "",
  message: "",
};

const contactHighlights = [
  "Dubai property purchase support",
  "Off-plan and project-led enquiries",
  "Private inventory and premium buyer routing",
];

const subjectOptions = [
  { value: "buying_property", label: "Buying property", intentType: "request_callback" },
  { value: "selling_property", label: "Selling property", intentType: "request_callback" },
  { value: "partnership_enquiry", label: "Partnership enquiry", intentType: "request_callback" },
  { value: "private_inventory", label: "Private inventory enquiry", intentType: "request_private_inventory" },
  { value: "golden_visa", label: "Golden Visa enquiry", intentType: "golden_visa" },
  { value: "general_enquiry", label: "General enquiry", intentType: "request_callback" },
];

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const selectedSubject = subjectOptions.find((item) => item.value === form.subject) || null;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedSubject) {
        throw new Error("Please choose a subject.");
      }

      await verifyRecaptchaAction("contact_form");

      const lead = await captureBuyerIntent({
        full_name: form.full_name,
        email: form.email,
        mobile: form.phone,
        whatsapp: form.phone,
        country: "",
        preferred_area: "",
        buying_purpose: "mover",
        offplan_or_ready: selectedSubject.value === "private_inventory" ? "either" : "unknown",
        cash_or_mortgage: "unknown",
        notes_summary: `[${selectedSubject.label}] ${form.message}`,
        notes: `[${selectedSubject.label}] ${form.message}`,
        intent_type: selectedSubject.intentType,
        source_channel: "web",
        source: "contact_page",
        lead_type: "buyer",
      });

      if (lead?.id && ["request_private_inventory", "golden_visa"].includes(selectedSubject.intentType)) {
        await base44.functions.invoke("openConciergeCase", {
          lead_id: lead.id,
          full_name: form.full_name,
          email: form.email,
          mobile: form.phone,
          whatsapp: form.phone,
          country: "",
          summary: `${selectedSubject.label} enquiry`,
          special_instructions: form.message,
          source: "contact_page",
          intent_type: selectedSubject.intentType,
          is_private_inventory: selectedSubject.intentType === "request_private_inventory",
          is_golden_visa_case: selectedSubject.intentType === "golden_visa",
          service_tier: selectedSubject.intentType === "request_private_inventory" ? "private_client" : selectedSubject.intentType === "golden_visa" ? "premium" : "standard",
          requires_nda: selectedSubject.intentType === "request_private_inventory",
        });
      }

      return lead;
    },
    onSuccess: () => {
      toast({ title: "Request received", description: "The team will review your message and respond through the contact details you shared." });
      setForm(initialForm);
    },
    onError: (error) => {
      toast({
        title: "Submission blocked",
        description: String(error?.message || "Please retry the enquiry form."),
        variant: "destructive",
      });
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
        description="Use the built-in enquiry form for buying, selling, partnership, private inventory, or general contact requests."
        titleAs="h1"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
          <CardContent className="p-6 lg:p-7">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">Send an enquiry</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Keep this simple. Share your details, choose the enquiry subject, and explain what you need. The page handles the submission directly without opening a mail client.
              </p>
            </div>

            <form
              className="mt-6 space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="contact-full-name">Name*</label>
                  <Input id="contact-full-name" autoComplete="name" required className="h-11 rounded-[1rem] border-slate-200 bg-white" value={form.full_name} onChange={handleChange("full_name")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="contact-email">Email*</label>
                  <Input id="contact-email" type="email" autoComplete="email" required className="h-11 rounded-[1rem] border-slate-200 bg-white" value={form.email} onChange={handleChange("email")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="contact-phone">Phone*</label>
                  <Input id="contact-phone" type="tel" autoComplete="tel" required className="h-11 rounded-[1rem] border-slate-200 bg-white" value={form.phone} onChange={handleChange("phone")} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="contact-subject">Subject*</label>
                  <Select value={form.subject} onValueChange={(value) => setForm((current) => ({ ...current, subject: value }))}>
                    <SelectTrigger id="contact-subject" className="h-11 rounded-[1rem] border-slate-200 bg-white" aria-label="Subject">
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent className="rounded-[1rem] border-slate-200">
                      {subjectOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="contact-message">Message*</label>
                <Textarea
                  id="contact-message"
                  required
                  className="min-h-[150px] rounded-[1.2rem] border-slate-200 bg-white px-4 py-3"
                  value={form.message}
                  onChange={handleChange("message")}
                  placeholder="Tell us what you are looking for, your timing, and any important requirements."
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  The team will review your message and respond through the contact details you provide.
                </p>
                <Button
                  type="submit"
                  className="h-11 rounded-full px-6"
                  disabled={mutation.isPending || !form.full_name || !form.email || !form.phone || !form.subject || !form.message}
                >
                  {mutation.isPending ? "Submitting..." : "Submit enquiry"}
                </Button>
              </div>
            </form>
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
