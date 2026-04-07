import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Instagram,
  Linkedin,
  MapPinned,
  Search,
  ShieldCheck,
  Youtube,
} from "lucide-react";
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
  { value: "fr-fr", flag: "🇫🇷", label: "French", detail: "Français" },
  { value: "de-de", flag: "🇩🇪", label: "German", detail: "Deutsch" },
  { value: "es-es", flag: "🇪🇸", label: "Spanish", detail: "Español" },
  { value: "pt-pt", flag: "🇵🇹", label: "Portuguese", detail: "Português" },
  { value: "it-it", flag: "🇮🇹", label: "Italian", detail: "Italiano" },
  { value: "nl-nl", flag: "🇳🇱", label: "Dutch", detail: "Nederlands" },
  { value: "ru-ru", flag: "🇷🇺", label: "Russian", detail: "Russia" },
  { value: "uk-ua", flag: "🇺🇦", label: "Ukrainian", detail: "Українська" },
  { value: "tr-tr", flag: "🇹🇷", label: "Turkish", detail: "Türkçe" },
  { value: "he-il", flag: "🇮🇱", label: "Hebrew", detail: "עברית" },
  { value: "fa-ir", flag: "🇮🇷", label: "Persian", detail: "فارسی" },
  { value: "hi-in", flag: "🇮🇳", label: "Hindi", detail: "हिन्दी" },
  { value: "ur-pk", flag: "🇵🇰", label: "Urdu", detail: "اردو" },
  { value: "pa-in", flag: "🇮🇳", label: "Punjabi", detail: "ਪੰਜਾਬੀ" },
  { value: "bn-bd", flag: "🇧🇩", label: "Bengali", detail: "বাংলা" },
  { value: "ta-in", flag: "🇮🇳", label: "Tamil", detail: "தமிழ்" },
  { value: "zh-cn", flag: "🇨🇳", label: "Mandarin", detail: "China" },
  { value: "zh-tw", flag: "🇹🇼", label: "Chinese Traditional", detail: "繁體中文" },
  { value: "ja-jp", flag: "🇯🇵", label: "Japanese", detail: "日本語" },
  { value: "ko-kr", flag: "🇰🇷", label: "Korean", detail: "한국어" },
  { value: "th-th", flag: "🇹🇭", label: "Thai", detail: "ไทย" },
  { value: "vi-vn", flag: "🇻🇳", label: "Vietnamese", detail: "Tiếng Việt" },
  { value: "id-id", flag: "🇮🇩", label: "Indonesian", detail: "Bahasa Indonesia" },
  { value: "ms-my", flag: "🇲🇾", label: "Malay", detail: "Bahasa Melayu" },
  { value: "fil-ph", flag: "🇵🇭", label: "Filipino", detail: "Filipino" },
  { value: "pl-pl", flag: "🇵🇱", label: "Polish", detail: "Polski" },
  { value: "el-gr", flag: "🇬🇷", label: "Greek", detail: "Ελληνικά" },
  { value: "ro-ro", flag: "🇷🇴", label: "Romanian", detail: "Română" },
  { value: "sv-se", flag: "🇸🇪", label: "Swedish", detail: "Svenska" },
  { value: "no-no", flag: "🇳🇴", label: "Norwegian", detail: "Norsk" },
  { value: "da-dk", flag: "🇩🇰", label: "Danish", detail: "Dansk" },
  { value: "fi-fi", flag: "🇫🇮", label: "Finnish", detail: "Suomi" },
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
  const [query, setQuery] = useState("");
  const filteredLanguages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return supportLanguages;

    return supportLanguages.filter((item) =>
      `${item.label} ${item.detail}`.toLowerCase().includes(normalized)
    );
  }, [query]);

  return (
    <div className="overflow-hidden rounded-[1.35rem] bg-slate-950 text-white">
      <div className="border-b border-slate-800 px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search languages"
            className="h-11 w-full rounded-[1rem] border border-slate-800 bg-slate-900 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-slate-700"
          />
        </div>
      </div>
      <div className="px-2 pb-2 pt-2">
        <div
          className="max-h-[21rem] overflow-y-auto pr-1"
          style={{ scrollbarGutter: "stable" }}
        >
          {filteredLanguages.length ? filteredLanguages.map((item) => {
            const selected = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  onValueChange(item.value);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[1rem] px-3 py-3 text-left transition",
                  selected
                    ? "bg-slate-900 text-white"
                    : "text-slate-200 hover:bg-slate-900/80"
                )}
              >
                <span className="text-base" aria-hidden="true">{item.flag}</span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-white">{item.label}</span>
                  <span className="truncate text-xs text-slate-400">{item.detail}</span>
                </span>
                <Check className={cn("h-4 w-4 text-slate-500", selected ? "opacity-100 text-white" : "opacity-0")} />
              </button>
            );
          }) : (
            <div className="px-3 py-6 text-sm text-slate-400">No matching language found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FooterLanguageSelector({ value, onValueChange }) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const selectedLanguage = supportLanguages.find((item) => item.value === value) || supportLanguages[0];
  const triggerClassName = "inline-flex h-12 w-full items-center justify-between gap-3 rounded-[1rem] border border-slate-800 bg-slate-950 px-4 text-left text-sm text-white shadow-[0_16px_30px_rgba(2,6,23,0.18)] transition hover:border-slate-700";

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
            <span className="truncate text-sm font-medium text-white">{selectedLanguage.label}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
        <SheetContent
          side="bottom"
          className="rounded-t-[1.8rem] border-slate-800 bg-slate-950 px-0 pb-0 text-white"
        >
          <SheetHeader className="px-5 pb-3 pt-1 text-left">
            <SheetTitle className="text-white">Choose language</SheetTitle>
            <SheetDescription className="text-slate-400">
              Pick the language that feels most natural to you.
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
            <span className="truncate text-sm font-medium text-white">{selectedLanguage.label}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={12}
        className="w-[24rem] rounded-[1.5rem] border-slate-800 bg-slate-950 p-0 text-white shadow-[0_30px_70px_rgba(2,6,23,0.38)]"
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

            <div className="space-y-5">
              <p className="border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Connect
              </p>

              <div className="flex flex-wrap gap-2.5" aria-label="Social links">
                {socialLinks.map((item) => (
                  <SocialLink key={item.label} href={item.href} label={item.label} icon={item.icon} />
                ))}
              </div>

              <FooterLanguageSelector value={language} onValueChange={handleLanguageChange} />
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
