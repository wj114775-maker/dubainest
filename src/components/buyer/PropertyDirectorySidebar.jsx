import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Bell, Building2, CarFront, ChevronRight, Map, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function SidebarSection({ title, items = [] }) {
  if (!items.length) return null;

  return (
    <Card className="rounded-[1.5rem] border-white/10 bg-card/95 shadow-lg shadow-black/5">
      <CardContent className="space-y-4 p-5">
        <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="block text-sm text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PropertyDirectorySidebar({ listings = [], onAlertOpen }) {
  const developers = useMemo(
    () => Array.from(new Set(listings.map((item) => item.developer_name).filter(Boolean))).sort().slice(0, 6),
    [listings]
  );

  const recommendedSearches = [
    { label: "Studios for sale in Dubai", path: "/properties?propertyType=Studio" },
    { label: "1 bedroom properties for sale", path: "/properties?beds=1" },
    { label: "2 bedroom apartments for sale", path: "/properties?propertyType=Apartment&beds=2" },
    { label: "Villas for sale in Dubai", path: "/properties?propertyType=Villa" },
    { label: "Penthouses for sale in Dubai", path: "/properties?propertyType=Penthouse" },
    { label: "Private inventory opportunities", path: "/properties?privateInventory=1" },
  ];

  const offPlanLinks = [
    { label: "Off-plan properties in Dubai", path: "/properties?completion=off_plan" },
    { label: "Map view for off-plan stock", path: "/properties?completion=off_plan&map_active=true" },
  ];

  const priceLinks = [
    { label: "Properties from AED 500K", path: "/properties?minPrice=500000" },
    { label: "Properties from AED 1M", path: "/properties?minPrice=1000000" },
    { label: "Properties under AED 5M", path: "/properties?maxPrice=5000000" },
    { label: "Luxury properties from AED 10M", path: "/properties?minPrice=10000000" },
  ];

  const developerLinks = developers.map((name) => ({
    label: `${name} properties for sale`,
    path: `/properties?keywords=${encodeURIComponent(name)}`,
  }));

  return (
    <div className="space-y-4">
      <Card className="rounded-[1.5rem] border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(24,119,242,0.12),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-lg shadow-black/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-primary/10 text-primary">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Explore by map view</p>
              <p className="mt-1 text-sm text-muted-foreground">Switch to map mode to understand where each area and project sits before you enquire.</p>
            </div>
          </div>
          <Button asChild className="w-full rounded-full">
            <Link to="/properties?map_active=true">
              Open map view
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-white/10 bg-card/95 shadow-lg shadow-black/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-amber-500/10 text-amber-700">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Be first to hear about new properties</p>
              <p className="mt-1 text-sm text-muted-foreground">Register interest and we will alert you when matching properties are released.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-full" onClick={onAlertOpen}>
            Alert me of new properties
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-white/10 bg-card/95 shadow-lg shadow-black/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-emerald-600/10 text-emerald-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Sell or rent your property</p>
              <p className="mt-1 text-sm text-muted-foreground">Connect with the team if you want representation on a sale, resale, or managed rental instruction.</p>
            </div>
          </div>
          <Button variant="outline" className="w-full rounded-full" onClick={onAlertOpen}>
            Get started
          </Button>
        </CardContent>
      </Card>

      <SidebarSection title="Recommended searches" items={recommendedSearches} />
      <SidebarSection title="Invest in off-plan" items={offPlanLinks} />
      <SidebarSection title="Top searches by price" items={priceLinks} />
      {developerLinks.length ? <SidebarSection title="Top searches by developers" items={developerLinks} /> : null}

      <Card className="rounded-[1.5rem] border-white/10 bg-card/95 shadow-lg shadow-black/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-sky-600/10 text-sky-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Off-plan and investment support</p>
              <p className="mt-1 text-sm text-muted-foreground">Ask the team about payment plans, launch access, and developer-backed opportunities.</p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link to="/properties?completion=off_plan">
              Explore off-plan
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-white/10 bg-card/95 shadow-lg shadow-black/5">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-slate-900/10 text-slate-900">
              <CarFront className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Area-by-area property search</p>
              <p className="mt-1 text-sm text-muted-foreground">Use the location links and map mode together to narrow the right community faster.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
