import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Compass, MapPinned, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function SidebarSection({ title, items = [] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-slate-50/75 p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{title}</h2>
      <div className="space-y-2">
        <div className="space-y-2">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="group flex items-center justify-between gap-3 rounded-[1rem] border border-transparent bg-white/90 px-3.5 py-3 text-sm leading-6 text-slate-600 transition hover:border-slate-200 hover:bg-white hover:text-slate-950"
            >
              <span className="min-w-0">{item.label}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-950" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function InlineLocations({ items = [] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Most searched locations</h2>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function PropertyDirectorySidebar({ locations = [] }) {
  const recommendedSearches = [
    { label: "Studios for sale in Dubai", path: "/properties?propertyType=Studio" },
    { label: "1 bedroom properties for sale", path: "/properties?beds=1" },
    { label: "2 bedroom apartments for sale", path: "/properties?propertyType=Apartment&beds=2" },
    { label: "Villas for sale in Dubai", path: "/properties?propertyType=Villa" },
    { label: "Penthouses for sale in Dubai", path: "/properties?propertyType=Penthouse" },
    { label: "Private inventory opportunities", path: "/private-inventory" },
  ];

  const offPlanLinks = [
    { label: "Off-plan properties in Dubai", path: "/off-plan" },
    { label: "Map view for off-plan stock", path: "/properties?completion=off_plan&map_active=true" },
  ];

  const priceLinks = [
    { label: "Properties from AED 500K", path: "/properties?minPrice=500000" },
    { label: "Properties from AED 1M", path: "/properties?minPrice=1000000" },
    { label: "Properties under AED 5M", path: "/properties?maxPrice=5000000" },
    { label: "Luxury properties from AED 10M", path: "/properties?minPrice=10000000" },
  ];

  const developerLinks = [
    { label: "Emaar properties for sale", path: "/properties?developer=Emaar" },
    { label: "Meraas properties for sale", path: "/properties?developer=Meraas" },
    { label: "Omniyat properties for sale", path: "/properties?developer=Omniyat" },
  ];

  const locationLinks = locations.map((name) => ({
    label: name,
    path: `/properties?q=${encodeURIComponent(name)}`,
  }));

  return (
    <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <CardContent className="space-y-5 p-5">
        <section className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-[linear-gradient(160deg,#0f172a_0%,#18253a_58%,#1d3147_100%)] p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/65">Browse intelligently</p>
              <h2 className="text-2xl font-semibold tracking-tight">Cleaner routes into Dubai purchase stock.</h2>
              <p className="text-sm leading-7 text-white/72">
                Use the quick links below when the buyer starts with a theme, location, or developer rather than a direct listing.
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-white/10">
              <Compass className="h-5 w-5" />
            </div>
          </div>
        </section>

        <InlineLocations items={locationLinks.slice(0, 4)} />
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/75 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-slate-900" />
              Sale-only directory
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Built for purchase routes only: ready stock, off-plan launches, and private inventory support.
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/75 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
              <Building2 className="h-3.5 w-3.5 text-slate-900" />
              Developer-aware
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Search themes are grouped around live stock, brand routes, and off-plan discovery rather than generic portal clutter.
            </p>
          </div>
        </section>
        <SidebarSection title="Recommended searches" items={recommendedSearches} />
        <SidebarSection title="Invest in off-plan" items={offPlanLinks} />
        <SidebarSection title="Top searches by price" items={priceLinks} />
        <SidebarSection title="Top searches by developers" items={developerLinks} />
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            <MapPinned className="h-3.5 w-3.5 text-slate-900" />
            Need a curated route?
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Use the contact route for a shortlist built around your preferred area, project timing, or developer focus.
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-950 transition hover:text-primary"
          >
            Contact us
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
