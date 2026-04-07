import React, { useState } from "react";
import { Link, createSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Search, Sparkles } from "lucide-react";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import DeveloperPicker from "@/components/buyer/DeveloperPicker";
import PropertyTypePicker from "@/components/buyer/PropertyTypePicker";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import { cn } from "@/lib/utils";

const collectionOptions = [
  { value: "all", label: "All sale stock" },
  { value: "ready", label: "Ready" },
  { value: "off_plan", label: "Off-Plan" },
  { value: "private_inventory", label: "Private inventory" },
];

const heroHighlights = [
  "Sale-only buyer journey",
  "Developer-aligned advisory",
  "Private inventory on request",
];

export default function HeroSearch({ appName, metrics }) {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [developer, setDeveloper] = useState("all");
  const [propertyCategory, setPropertyCategory] = useState("all");
  const [propertyType, setPropertyType] = useState([]);
  const [collection, setCollection] = useState("all");
  const [open, setOpen] = useState(false);
  const { data: approvedDevelopers = [] } = useApprovedDevelopers();
  const featuredDeveloperNames = metrics?.topDeveloperNames || [];

  const openProperties = (overrides = {}) => {
    const next = {
      location,
      developer,
      propertyCategory,
      propertyType,
      collection,
      ...overrides,
    };

    const params = {};
    if (next.location.trim()) params.q = next.location.trim();
    if (next.developer !== "all") params.developer = next.developer;
    if (next.propertyCategory !== "all") params.category = next.propertyCategory;
    if (next.propertyType.length) params.propertyType = next.propertyType.join(",");
    if (next.collection === "ready") params.completion = "ready";
    if (next.collection === "off_plan") params.completion = "off_plan";
    if (next.collection === "private_inventory") params.privateInventory = "1";

    const query = createSearchParams(params).toString();
    navigate(query ? `/properties?${query}` : "/properties");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    openProperties();
  };

  return (
    <section className="relative -mx-4 overflow-hidden rounded-[2rem] sm:-mx-6 lg:-mx-8 xl:-mx-10">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2200&q=80"
          alt="Dubai skyline and luxury residences"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,14,24,0.88),rgba(13,22,38,0.74),rgba(8,14,24,0.82))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,165,92,0.22),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(20,92,76,0.18),transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[41rem] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center text-white">
          <Badge className="rounded-full border border-white/15 bg-white px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-slate-900 shadow-[0_12px_30px_rgba(0,0,0,0.12)] hover:bg-white">
            Dubai property purchase
          </Badge>
          <div className="mt-6 space-y-4">
            <h1 className="text-[2.65rem] font-semibold tracking-tight md:text-[4.2rem] md:leading-[1.02]">
              Search Dubai properties for sale through one clear buyer journey.
            </h1>
            <p className="mx-auto max-w-3xl text-sm leading-7 text-white/78 md:text-base">
              {appName} is built for purchase only: ready homes, off-plan launches, and private inventory routed into direct advisory support.
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-[74rem] rounded-[2rem] border border-slate-200/85 bg-white/95 p-4 shadow-[0_28px_90px_rgba(4,12,24,0.22)] backdrop-blur md:p-5">
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-slate-50/90 p-1.5">
              <Badge className="rounded-full bg-slate-950 px-4 py-2 text-[11px] text-white hover:bg-slate-950">Properties</Badge>
              <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-white hover:text-slate-950">
                <Link to="/projects">New projects</Link>
              </Button>
              <Button variant="ghost" className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-white hover:text-slate-950" onClick={() => setOpen(true)}>
                Private client
              </Button>
              <Button asChild variant="ghost" className="rounded-full px-4 py-2 text-sm text-slate-600 hover:bg-white hover:text-slate-950">
                <Link to="/guides">Guides</Link>
              </Button>
            </div>
          </div>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1.05fr)_minmax(0,1.05fr)_12rem]">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-700" />
                  Location
                </div>
                <Input
                  placeholder="Search area, community, or project"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="mt-2 h-8 border-none px-0 text-[15px] text-slate-950 shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Building2 className="h-3.5 w-3.5 text-slate-700" />
                  Developer
                </div>
                <DeveloperPicker
                  value={developer}
                  onChange={setDeveloper}
                  developers={approvedDevelopers}
                  featuredDeveloperNames={featuredDeveloperNames}
                  placeholder="Any developer"
                  triggerClassName="mt-2 h-8 border-none px-0 text-[15px] text-slate-950 shadow-none focus-visible:ring-0"
                  contentClassName="w-[380px]"
                />
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 text-slate-700" />
                  Property type
                </div>
                <PropertyTypePicker
                  categoryValue={propertyCategory}
                  value={propertyType}
                  onCategoryChange={setPropertyCategory}
                  onValueChange={setPropertyType}
                  triggerClassName="mt-2 h-8 border-none px-0 text-[15px] text-slate-950 shadow-none focus-visible:ring-0"
                  contentClassName="w-[400px]"
                />
              </div>

              <Button type="submit" className="h-full min-h-[5rem] rounded-[1.35rem] bg-slate-950 px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.16)] hover:bg-slate-900">
                <Search className="mr-2 h-4 w-4" />
                Search properties
              </Button>
            </div>

            <div className="grid gap-3 border-t border-slate-200 pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex flex-wrap gap-1.5">
                {collectionOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCollection(option.value)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                      collection === option.value
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-500 lg:justify-end">
                {heroHighlights.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>

      <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="request_private_inventory" title="Request private inventory access" />
    </section>
  );
}
