import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Instagram, Linkedin, Mail, MapPinned, MessageCircleMore, Youtube } from "lucide-react";
import { defaultAppConfig } from "@/lib/appShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const publicGroups = [
{
  title: "Explore",
  links: [
  { label: "Properties", path: "/properties" },
  { label: "Projects", path: "/projects" },
  { label: "Developers", path: "/developers" },
  { label: "Areas", path: "/areas" },
  { label: "Guides", path: "/guides" }]

},
{
  title: "Buyer services",
  links: [
  { label: "Golden Visa", path: "/golden-visa" },
  { label: "Buyer qualification", path: "/quiz" },
  { label: "Private inventory", path: "/properties?privateInventory=1" },
  { label: "Off-plan search", path: "/properties?completion=off_plan" }]

},
{
  title: "Company",
  links: [
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
  { label: "Site map", path: "/sitemap" },
  { label: "Privacy", path: "/privacy" },
  { label: "Terms", path: "/terms" }]

}];


const supportLanguages = [
{ value: "en-ae", flag: "🇦🇪", label: "English", detail: "United Arab Emirates" },
{ value: "ar-sa", flag: "🇸🇦", label: "Arabic", detail: "Saudi Arabia" },
{ value: "ru-ru", flag: "🇷🇺", label: "Russian", detail: "Russia" },
{ value: "zh-cn", flag: "🇨🇳", label: "Mandarin", detail: "China" }];


const socialLinks = [
{ label: "Instagram", href: "https://www.instagram.com/dubaisphere", icon: Instagram },
{ label: "LinkedIn", href: "https://www.linkedin.com/company/dubaisphere", icon: Linkedin },
{ label: "YouTube", href: "https://www.youtube.com/@dubaisphere", icon: Youtube }];


function ExternalLinkButton({ href, label, icon: Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-950 bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-slate-800 hover:border-slate-800">
      
      <Icon className="h-4 w-4" />
    </a>);

}

export default function SiteFooter({ appName }) {
  const [language, setLanguage] = useState(supportLanguages[0].value);
  const whatsappUrl = `https://wa.me/${String(defaultAppConfig.whatsapp_number || "").replace(/[^\d]/g, "")}`;
  const selectedLanguage = supportLanguages.find((item) => item.value === language) || supportLanguages[0];

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("dubaisphere-language");
    if (saved && supportLanguages.some((item) => item.value === saved)) {
      setLanguage(saved);
    }
  }, []);

  const handleLanguageChange = (value) => {
    setLanguage(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dubaisphere-language", value);
    }
  };

  return (
    <footer className="mt-16">
      <div className="bg-[#f9f9fb] border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="grid gap-5 rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-sm shadow-black/5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.95fr)] lg:items-center lg:p-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Stay connected</p>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Talk to DubaiSphere or keep following the market.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Fast buyer support on WhatsApp, direct business contact by email, and a cleaner public brand presence across the channels that matter.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:items-end">
              <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800">
                  
                  <MessageCircleMore className="h-4 w-4" />
                  WhatsApp
                </a>
                <a
                  href={`mailto:${defaultAppConfig.support_email}`}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:text-slate-950">
                  
                  <Mail className="h-4 w-4" />
                  Email us
                </a>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:justify-end">
                <div className="flex flex-wrap items-center gap-2.5">
                  {socialLinks.map((item) => <ExternalLinkButton key={item.label} href={item.href} label={item.label} icon={item.icon} />)}
                </div>

                <div className="space-y-2 lg:min-w-[17rem]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Language</p>
                  <Select value={language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="h-11 rounded-[1rem] border-slate-300 bg-white px-4 text-sm shadow-none">
                      <SelectValue>
                        <span className="inline-flex items-center gap-2 text-slate-800">
                          <span aria-hidden="true">{selectedLanguage.flag}</span>
                          <span>{selectedLanguage.label}</span>
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-[1rem] border-slate-200">
                      {supportLanguages.map((item) =>
                      <SelectItem key={item.value} value={item.value} className="rounded-[0.8rem] px-3 py-2">
                          <span className="inline-flex items-center gap-3">
                            <span aria-hidden="true">{item.flag}</span>
                            <span className="flex flex-col">
                              <span className="font-medium text-slate-900">{item.label}</span>
                              <span className="text-xs text-slate-500">{item.detail}</span>
                            </span>
                          </span>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,0.8fr))]">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-black/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">{appName}</p>
                <p className="text-sm text-slate-300">Sale-only property search and buyer advisory.</p>
              </div>
            </div>

            <p className="max-w-sm text-sm leading-7 text-slate-300">
              A cleaner public experience for Dubai property purchase, off-plan opportunities, and private client support.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-slate-500" />
                Dubai, United Arab Emirates
              </span>
              <a href={`mailto:${defaultAppConfig.support_email}`} className="inline-flex items-center gap-2 transition hover:text-white">
                <Mail className="h-4 w-4 text-slate-500" />
                {defaultAppConfig.support_email}
              </a>
            </div>
          </div>

          {publicGroups.map((group) =>
          <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{group.title}</p>
              <div className="mt-4 space-y-3">
                {group.links.map((link) =>
              <Link
                key={link.path}
                to={link.path}
                className="block text-sm text-slate-300 transition hover:text-white">
                
                    {link.label}
                  </Link>
              )}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-400 md:flex-row md:items-center md:justify-between md:px-6">
            <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
            <p>Sale only. Off-plan, ready stock, and private inventory routes.</p>
          </div>
        </div>
      </div>
    </footer>);

}