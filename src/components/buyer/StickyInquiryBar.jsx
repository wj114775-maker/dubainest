import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  MessageCircleMore,
  PhoneCall,
  ShieldCheck,
  X,
} from "lucide-react";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import { cn } from "@/lib/utils";
import useAppConfig from "@/hooks/useAppConfig";

function buildWhatsAppUrl(phone) {
  const sanitized = String(phone || "").replace(/[^\d]/g, "");
  if (!sanitized) return "/contact";
  const text = encodeURIComponent("Hello DubaiSphere, I would like help with my property search.");
  return `https://wa.me/${sanitized}?text=${text}`;
}

function ActionTile({ href, to, icon: Icon, label, accent = "default", external = false, onClick }) {
  const sharedClassName = cn(
    "group flex min-h-[6.5rem] flex-col items-center justify-center gap-3 rounded-[1.25rem] border px-3 py-4 text-center transition duration-200 hover:-translate-y-0.5",
    accent === "primary" && "border-slate-950 bg-slate-950 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:bg-slate-900",
    accent === "whatsapp" && "border-emerald-500 bg-emerald-500 text-white shadow-[0_14px_28px_rgba(16,185,129,0.18)] hover:bg-emerald-600",
    accent === "default" && "border-slate-200 bg-white text-slate-900 shadow-[0_12px_24px_rgba(15,23,42,0.07)] hover:border-slate-300"
  );
  const iconWrapClassName = cn(
    "inline-flex h-11 w-11 items-center justify-center rounded-full transition duration-200",
    accent === "primary" && "bg-white/12 text-white group-hover:bg-white/16",
    accent === "whatsapp" && "bg-white/14 text-white group-hover:bg-white/18",
    accent === "default" && "bg-slate-100 text-slate-950 group-hover:bg-slate-200"
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={sharedClassName}>
        <span className={iconWrapClassName}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={sharedClassName}>
        <span className={iconWrapClassName}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={sharedClassName}>
      <span className={iconWrapClassName}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.18em]">{label}</span>
    </button>
  );
}

export default function StickyInquiryBar() {
  const { data: appConfig } = useAppConfig();
  const widgetRef = useRef(null);
  const [intentType, setIntentType] = useState("request_callback");
  const [intentOpen, setIntentOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const whatsappUrl = useMemo(
    () => buildWhatsAppUrl(appConfig?.whatsapp_number),
    [appConfig?.whatsapp_number]
  );
  const hasDirectWhatsApp = whatsappUrl.startsWith("https://");

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const handleChange = (event) => {
      setIsMobile(event.matches);
      if (!event.matches) return;
      setHovered(false);
    };

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!panelOpen) return;
      if (widgetRef.current?.contains(event.target)) return;
      setPanelOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setPanelOpen(false);
        setHovered(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [panelOpen]);

  const showPanel = panelOpen || (!isMobile && hovered);

  return (
    <>
      <div
        ref={widgetRef}
        className="group pointer-events-none fixed bottom-24 right-4 z-40 md:bottom-[5.5rem] md:right-6"
        onMouseEnter={() => {
          if (!isMobile) setHovered(true);
        }}
        onMouseLeave={() => {
          if (!isMobile) setHovered(false);
        }}
      >
        <div className="pointer-events-auto relative flex items-center justify-end">
          {isMobile && showPanel ? (
            <button
              type="button"
              aria-label="Close help panel"
              className="fixed inset-0 z-0 bg-slate-950/35"
              onClick={() => setPanelOpen(false)}
            />
          ) : null}

          <div
            className={cn(
              "absolute bottom-16 right-0 z-10 w-[calc(100vw-2rem)] max-w-[24rem] transition duration-200 md:w-[23rem]",
              showPanel
                ? "pointer-events-auto visible translate-y-0 opacity-100"
                : "pointer-events-none invisible translate-y-4 opacity-0"
            )}
          >
            <div className="overflow-hidden rounded-[1.7rem] border border-white/50 bg-white/95 p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:22px_22px] opacity-25" />

              <div className="relative space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">DubaiSphere</p>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-slate-950">Need help with the next step?</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Choose the route that suits you best. Nothing starts until you ask us to help.
                      </p>
                    </div>
                  </div>

                  {isMobile ? (
                    <button
                      type="button"
                      aria-label="Close help panel"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900"
                      onClick={() => setPanelOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <ActionTile
                    icon={PhoneCall}
                    label="Callback"
                    onClick={() => {
                      setIntentType("request_callback");
                      setIntentOpen(true);
                      setPanelOpen(false);
                    }}
                  />

                  <ActionTile
                    to="/contact"
                    icon={Mail}
                    label="Contact"
                    accent="primary"
                    onClick={() => setPanelOpen(false)}
                  />

                  {hasDirectWhatsApp ? (
                    <ActionTile href={whatsappUrl} icon={MessageCircleMore} label="WhatsApp" accent="whatsapp" external />
                  ) : (
                    <ActionTile
                      to="/contact"
                      icon={MessageCircleMore}
                      label="WhatsApp"
                      accent="whatsapp"
                      onClick={() => setPanelOpen(false)}
                    />
                  )}
                </div>

                <div className="inline-flex w-full items-start gap-2 rounded-[1rem] border border-slate-200 bg-slate-50/90 px-3 py-3 text-xs leading-5 text-slate-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-900" />
                  Registration only begins when you request a callback, message the team, or open the contact form.
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-20 flex h-16 w-16 items-center justify-center rounded-full bg-white/40 shadow-[0_18px_40px_rgba(15,23,42,0.18)] backdrop-blur-md">
            <button
              type="button"
              aria-label="Open help options"
              aria-expanded={showPanel}
              className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[linear-gradient(180deg,rgba(16,43,87,0.98),rgba(11,28,56,0.98))] text-white shadow-[0_18px_40px_rgba(15,23,42,0.24)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.28)]"
              onClick={() => setPanelOpen((current) => !current)}
            >
              <span className="absolute inset-[-6px] rounded-full border border-slate-900/10 animate-[ping_2.8s_ease-out_infinite]" />
              <MessageCircleMore className="relative h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <BuyerIntentSheet open={intentOpen} onOpenChange={setIntentOpen} intentType={intentType} title="Buyer request" />
    </>
  );
}
