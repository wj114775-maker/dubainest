import React from "react";
import { Link } from "react-router-dom";
import { Building2, Globe2, Instagram, Linkedin, Mail, MapPinned, MessageCircleMore, Youtube } from "lucide-react";
import { defaultAppConfig } from "@/lib/appShell";

const utilityLinks = [
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
  { label: "Site map", path: "/sitemap" },
  { label: "Account", path: "/account" },
];

const publicGroups = [
  {
    title: "Browse",
    links: [
      { label: "Properties", path: "/properties" },
      { label: "Projects", path: "/projects" },
      { label: "Developers", path: "/developers" },
      { label: "Areas", path: "/areas" },
      { label: "Guides", path: "/guides" },
    ],
  },
  {
    title: "Buyer routes",
    links: [
      { label: "Golden Visa", path: "/golden-visa" },
      { label: "Buyer qualification", path: "/quiz" },
      { label: "Private inventory", path: "/properties?privateInventory=1" },
      { label: "Off-plan search", path: "/properties?completion=off_plan" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", path: "/about" },
      { label: "Contact", path: "/contact" },
      { label: "Privacy", path: "/privacy" },
      { label: "Terms", path: "/terms" },
    ],
  },
];

const supportLanguages = [
  { flag: "🇦🇪", label: "English" },
  { flag: "🇸🇦", label: "Arabic" },
  { flag: "🇷🇺", label: "Russian" },
  { flag: "🇨🇳", label: "Mandarin" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/dubaisphere", icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/dubaisphere", icon: Linkedin },
  { label: "YouTube", href: "https://www.youtube.com/@dubaisphere", icon: Youtube },
];

function ExternalLinkButton({ href, label, icon: Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
    >
      <Icon className="h-4.5 w-4.5" />
    </a>
  );
}

export default function SiteFooter({ appName }) {
  const whatsappUrl = `https://wa.me/${String(defaultAppConfig.whatsapp_number || "").replace(/[^\d]/g, "")}`;

  return (
    <footer className="mt-16">
      <div className="border-t border-slate-200 bg-slate-100/90">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[minmax(0,1.1fr)_auto_minmax(0,0.9fr)] lg:items-center">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Connect and continue</p>
            <div className="flex flex-wrap items-center gap-3">
              <ExternalLinkButton href={whatsappUrl} label="WhatsApp" icon={MessageCircleMore} />
              <ExternalLinkButton href={`mailto:${defaultAppConfig.support_email}`} label="Email" icon={Mail} />
              {socialLinks.map((item) => <ExternalLinkButton key={item.label} href={item.href} label={item.label} icon={item.icon} />)}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
            {utilityLinks.map((link) => (
              <Link key={link.path} to={link.path} className="transition hover:text-slate-950">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="space-y-2 lg:justify-self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Support languages</p>
            <div className="flex flex-wrap gap-2">
              {supportLanguages.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                  <span aria-hidden="true">{item.flag}</span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))]">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-lg shadow-black/20">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight">{appName}</p>
                <p className="text-sm text-slate-300">
                  Dubai property purchase, off-plan, and private client advisory.
                </p>
              </div>
            </div>

            <p className="max-w-md text-sm leading-7 text-slate-300">
              Search Dubai sale opportunities, explore project pages, review developer-led stock, and move into guided advisory support when you are ready.
            </p>

            <div className="grid gap-3 text-sm text-slate-300">
              <span className="inline-flex items-center gap-2">
                <MessageCircleMore className="h-4 w-4 text-slate-400" />
                {defaultAppConfig.whatsapp_number}
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                {defaultAppConfig.support_email}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-slate-400" />
                Dubai, United Arab Emirates
              </span>
              <span className="inline-flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-slate-400" />
                Buyer-facing public site with governed back-office operations
              </span>
            </div>
          </div>

          {publicGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{group.title}</p>
              <div className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="block text-sm text-slate-300 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-slate-400 md:flex-row md:items-center md:justify-between md:px-6">
            <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link to="/privacy" className="transition hover:text-white">Privacy</Link>
              <Link to="/terms" className="transition hover:text-white">Terms</Link>
              <Link to="/sitemap" className="transition hover:text-white">Site map</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
