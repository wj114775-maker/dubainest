import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, MapPinned, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const searchRegions = [
  {
    value: "dubai",
    label: "Dubai",
    description: "Start with the city and routes that drive the highest buyer demand across ready stock, off-plan launches, and private client search.",
    groups: [
      {
        title: "Ready to buy",
        icon: Building2,
        links: [
          { label: "Apartments in Downtown Dubai", to: "/properties?q=Downtown%20Dubai&propertyType=Apartment" },
          { label: "Villas in Dubai Hills Estate", to: "/properties?q=Dubai%20Hills%20Estate&propertyType=Villa" },
          { label: "Townhouses in Arabian Ranches", to: "/properties?q=Arabian%20Ranches&propertyType=Townhouse" },
          { label: "Waterfront homes in Palm Jumeirah", to: "/properties?q=Palm%20Jumeirah" },
        ],
      },
      {
        title: "Off-plan launches",
        icon: Sparkles,
        links: [
          { label: "Off-plan in Dubai Creek Harbour", to: "/properties?completion=off_plan&q=Dubai%20Creek%20Harbour" },
          { label: "Off-plan in Dubai South", to: "/properties?completion=off_plan&q=Dubai%20South" },
          { label: "New launches by Emaar", to: "/properties?completion=off_plan&developer=Emaar" },
          { label: "See all project pages", to: "/projects" },
        ],
      },
      {
        title: "Buyer routes",
        icon: MapPinned,
        links: [
          { label: "Private inventory only", to: "/private-inventory" },
          { label: "Browse published developers", to: "/developers" },
          { label: "Explore area intelligence", to: "/areas" },
          { label: "Read buyer guides", to: "/guides" },
        ],
      },
    ],
  },
  {
    value: "abu-dhabi",
    label: "Abu Dhabi",
    description: "Keep Abu Dhabi routes visible for wider UAE buyers without diluting the main Dubai-first positioning of the brand.",
    groups: [
      {
        title: "Ready to buy",
        icon: Building2,
        links: [
          { label: "Apartments in Saadiyat Island", to: "/properties?q=Saadiyat%20Island&propertyType=Apartment" },
          { label: "Apartments in Yas Island", to: "/properties?q=Yas%20Island&propertyType=Apartment" },
          { label: "Villas in Al Reem Island", to: "/properties?q=Al%20Reem%20Island&propertyType=Villa" },
          { label: "Prime homes in Al Maryah Island", to: "/properties?q=Al%20Maryah%20Island" },
        ],
      },
      {
        title: "Off-plan launches",
        icon: Sparkles,
        links: [
          { label: "Off-plan in Saadiyat Island", to: "/properties?completion=off_plan&q=Saadiyat%20Island" },
          { label: "Off-plan in Yas Island", to: "/properties?completion=off_plan&q=Yas%20Island" },
          { label: "Aldar-linked launches", to: "/properties?completion=off_plan&developer=Aldar" },
          { label: "Project pages across the UAE", to: "/projects" },
        ],
      },
      {
        title: "Buyer routes",
        icon: MapPinned,
        links: [
          { label: "Private client property search", to: "/private-inventory" },
          { label: "Compare active developers", to: "/developers" },
          { label: "Review supported areas", to: "/areas" },
          { label: "Golden Visa pathway", to: "/golden-visa" },
        ],
      },
    ],
  },
  {
    value: "other-emirates",
    label: "Other Emirates",
    description: "Support broader UAE discovery with a smaller, cleaner set of curated links instead of a portal-style wall of every possible query.",
    groups: [
      {
        title: "Ready to buy",
        icon: Building2,
        links: [
          { label: "Apartments in Ras Al Khaimah", to: "/properties?q=Ras%20Al%20Khaimah&propertyType=Apartment" },
          { label: "Apartments in Sharjah", to: "/properties?q=Sharjah&propertyType=Apartment" },
          { label: "Villas in Ajman", to: "/properties?q=Ajman&propertyType=Villa" },
          { label: "Homes in Al Marjan Island", to: "/properties?q=Al%20Marjan%20Island" },
        ],
      },
      {
        title: "Off-plan launches",
        icon: Sparkles,
        links: [
          { label: "Off-plan in Ras Al Khaimah", to: "/properties?completion=off_plan&q=Ras%20Al%20Khaimah" },
          { label: "Off-plan in Sharjah", to: "/properties?completion=off_plan&q=Sharjah" },
          { label: "Off-plan in Ajman", to: "/properties?completion=off_plan&q=Ajman" },
          { label: "Published new projects", to: "/projects" },
        ],
      },
      {
        title: "Buyer routes",
        icon: MapPinned,
        links: [
          { label: "All sale stock", to: "/properties" },
          { label: "Browse developer pages", to: "/developers" },
          { label: "Area pages", to: "/areas" },
          { label: "Research and guides", to: "/guides" },
        ],
      },
    ],
  },
];

export default function PopularSearchHub() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-slate-100/90 p-5 shadow-sm shadow-black/5 lg:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
            Sale only
          </div>
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Popular property searches</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Use a cleaner search hub to jump into the routes buyers use most often, without turning the page into a portal-sized block of links.
            </p>
          </div>
        </div>

        <Link
          to="/properties"
          className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-800 transition hover:border-slate-400 hover:text-slate-950"
        >
          Open all sale listings
        </Link>
      </div>

      <Tabs defaultValue={searchRegions[0].value} className="mt-6 space-y-5">
        <TabsList className="h-auto flex-wrap justify-start gap-2 rounded-[1.3rem] bg-white p-1.5 shadow-sm shadow-black/5">
          {searchRegions.map((region) => (
            <TabsTrigger
              key={region.value}
              value={region.value}
              className="rounded-[1rem] px-4 py-2.5 text-sm data-[state=active]:bg-slate-950 data-[state=active]:text-white"
            >
              {region.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {searchRegions.map((region) => (
          <TabsContent key={region.value} value={region.value} className="mt-0 space-y-5">
            <p className="max-w-3xl text-sm leading-7 text-slate-600">{region.description}</p>

            <div className="grid gap-4 xl:grid-cols-3">
              {region.groups.map((group) => {
                const Icon = group.icon;
                return (
                  <div key={group.title} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm shadow-black/5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-slate-950 text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">{group.title}</h3>

                    <div className="mt-4 space-y-2.5">
                      {group.links.map((link) => (
                        <Link
                          key={link.label}
                          to={link.to}
                          className="group flex items-center justify-between rounded-[1rem] border border-slate-200 px-3.5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                        >
                          <span className="pr-3">{link.label}</span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:text-slate-900" />
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
