import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Globe2,
  Instagram,
  Linkedin,
  MapPinned,
  ShieldCheck,
  Youtube,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "Properties", path: "/properties" },
      { label: "Projects", path: "/projects" },
      { label: "Developers", path: "/developers" },
      { label: "Areas", path: "/areas" },
      { label: "Guides", path: "/guides" },
    ],
  },
  {
    title: "Buyer services",
    links: [
      { label: "Golden Visa", path: "/golden-visa" },
      { label: "Buyer qualification", path: "/buyer-qualification" },
      { label: "Private inventory", path: "/private-inventory" },
      { label: "Off-plan", path: "/off-plan" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", path: "/about" },
      { label: "Site map", path: "/sitemap" },
      { label: "Privacy", path: "/privacy" },
      { label: "Terms", path: "/terms" },
    ],
  },
];

const supportLanguages = [
  { value: "en-ae", flag: "🇦🇪", label: "English", detail: "United Arab Emirates" },
  { value: "ar-ae", flag: "🇦🇪", label: "Arabic", detail: "United Arab Emirates" },
  { value: "ru-ru", flag: "🇷🇺", label: "Russian", detail: "Russia" },
  { value: "zh-cn", flag: "🇨🇳", label: "Mandarin", detail: "China" },
  { value: "hi-in", flag: "🇮🇳", label: "Hindi", detail: "India" },
  { value: "fr-fr", flag: "🇫🇷", label: "French", detail: "France" },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/dubaisphere", icon: Instagram },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/dubaisphere", icon: Linkedin },
  { label: "YouTube", href: "https://www.youtube.com/@dubaisphere", icon: Youtube },
];

function SocialLink({ href, label, icon: Icon }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 shadow-[0_14px_28px_rgba(2,6,23,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.09] hover:text-white"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

function LanguageList({ value, onValueChange, onClose }) {
  return (
    <Command className="overflow-hidden rounded-[1.35rem] bg-transparent text-white">
      <div className="border-b border-white/10 px-4 py-3">
        <CommandInput
          placeholder="Search language"
          className="h-11 rounded-[1rem] border border-white/10 bg-white/[0.05] px-0 text-sm text-white placeholder:text-slate-400"
        />
      </div>
      <CommandList className="max-h-[18.5rem] p-2">
        <CommandEmpty className="py-6 text-sm text-slate-400">No matching language found.</CommandEmpty>
        <CommandGroup
          heading="Support languages"
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.24em] [&_[cmdk-group-heading]]:text-slate-500"
        >
          {supportLanguages.map((item) => {
            const selected = item.value === value;
            return (
              <CommandItem
                key={item.value}
                value={`${item.label} ${item.detail}`}
                onSelect={() => {
                  onValueChange(item.value);
                  onClose();
                }}
                className="rounded-[1rem] px-3 py-3 text-slate-200 data-[selected=true]:bg-white/[0.08] data-[selected=true]:text-white"
              >
                <span className="text-base" aria-hidden="true">{item.flag}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-white">{item.label}</span>
                  <span className="truncate text-xs text-slate-400">{item.detail}</span>
                </span>
                <Check className={cn("h-4 w-4 text-slate-500", selected ? "opacity-100 text-white" : "opacity-0")} />
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

function FooterLanguageSelector({ value, onValueChange }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const selectedLanguage = supportLanguages.find((item) => item.value === value) || supportLanguages[0];
  const triggerClassName = "inline-flex h-12 w-full items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-white/[0.05] px-4 text-left text-sm text-white shadow-[0_16px_30px_rgba(2,6,23,0.16)] transition hover:border-white/20 hover:bg-white/[0.08]";

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleChange = (event) => setIsMobile(event.matches);

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
          <span className="inline-flex min-w-0 items-center gap-3">
            <span className="text-base" aria-hidden="true">{selectedLanguage.flag}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Language</span>
              <span className="truncate text-sm font-medium text-white">{selectedLanguage.label}</span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <SheetContent
          side="bottom"
          className="rounded-t-[1.8rem] border-white/10 bg-slate-950 px-0 pb-0 text-white"
        >
          <SheetHeader className="px-5 pb-3 pt-1 text-left">
            <SheetTitle className="text-white">Language and region</SheetTitle>
            <SheetDescription className="text-slate-400">
              Choose the language that feels most natural for your enquiry.
            </SheetDescription>
          </SheetHeader>
          <div className="px-3 pb-3">
            <LanguageList value={value} onValueChange={onValueChange} onClose={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={triggerClassName}>
          <span className="inline-flex min-w-0 items-center gap-3">
            <span className="text-base" aria-hidden="true">{selectedLanguage.flag}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Language</span>
              <span className="truncate text-sm font-medium text-white">{selectedLanguage.label}</span>
            </span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="w-[22rem] rounded-[1.5rem] border-white/10 bg-slate-950/98 p-0 text-white shadow-[0_30px_70px_rgba(2,6,23,0.38)] backdrop-blur-xl"
      >
        <LanguageList value={value} onValueChange={onValueChange} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

export default function SiteFooter({ appName }) {
  const [language, setLanguage] = useState(supportLanguages[0].value);

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
    <footer className="mt-20">
      <section className="relative overflow-hidden border-y border-slate-300/70 bg-slate-200/90">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:32px_32px] opacity-35" />
        <div className="absolute -right-24 top-[-3rem] h-56 w-56 rounded-full bg-white/50 blur-3xl" />
        <div className="absolute right-24 top-12 h-44 w-44 rounded-full border border-white/50" />
        <div className="absolute right-8 top-[-1rem] h-72 w-72 rounded-full border border-white/40" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:py-12">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">DubaiSphere</p>
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-slate-950 md:text-[2rem] md:leading-[1.1]">
              Property guidance with a cleaner, more private experience.
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              Sale-only property search, off-plan opportunities, and buyer support designed for clearer decisions across Dubai.
            </p>
          </div>

          <div className="flex justify-start lg:justify-end">
            <Link
              to="/contact"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-6 text-sm font-medium text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)] transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Contact us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="relative overflow-hidden bg-[linear-gradient(180deg,#08111f_0%,#020617_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:38px_38px] opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-6 lg:py-12">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.75fr))_minmax(0,0.95fr)]">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.06] text-white shadow-[0_18px_30px_rgba(0,0,0,0.24)]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-semibold tracking-[-0.02em] text-white">{appName}</p>
                  <p className="text-sm text-slate-400">Sale-only property search and buyer advisory.</p>
                </div>
              </div>

              <p className="max-w-md text-sm leading-7 text-slate-300">
                A cleaner public experience for Dubai property purchase, project discovery, off-plan opportunities, and private buyer support.
              </p>

              <div className="flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                  <MapPinned className="h-4 w-4 text-slate-400" />
                  Dubai, United Arab Emirates
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-slate-400" />
                  Private buyer support
                </span>
              </div>
            </div>

            {footerGroups.map((group) => (
              <div key={group.title} className="space-y-4">
                <p className="border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {group.title}
                </p>
                <div className="space-y-3">
                  {group.links.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block w-fit text-sm text-slate-300 transition hover:translate-x-0.5 hover:text-white"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="space-y-4">
              <p className="border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Connect
              </p>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <p className="text-sm leading-7 text-slate-400">
                  Follow DubaiSphere and choose the language that feels most natural for your enquiry.
                </p>

                <div className="mt-4 flex flex-wrap gap-2.5" aria-label="Social links">
                  {socialLinks.map((item) => (
                    <SocialLink key={item.label} href={item.href} label={item.label} icon={item.icon} />
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    <Globe2 className="h-3.5 w-3.5" />
                    Language
                  </div>
                  <FooterLanguageSelector value={language} onValueChange={handleLanguageChange} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-5">
            <div className="flex flex-col gap-2 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
              <p>© {new Date().getFullYear()} {appName}. All rights reserved.</p>
              <p>Sale only. Off-plan, ready stock, and private inventory routes.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
