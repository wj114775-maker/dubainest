import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

function SidebarSection({ title, items = [] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-2">
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className="block text-sm leading-6 text-muted-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
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

  const developerLinks = [
    { label: "Emaar properties for sale", path: "/properties?keywords=Emaar" },
    { label: "Meraas properties for sale", path: "/properties?keywords=Meraas" },
    { label: "Omniyat properties for sale", path: "/properties?keywords=Omniyat" },
  ];

  const locationLinks = locations.map((name) => ({
    label: name,
    path: `/properties?q=${encodeURIComponent(name)}`,
  }));

  return (
    <Card className="rounded-[1.5rem] border-white/10 bg-card shadow-lg shadow-black/5">
      <CardContent className="space-y-6 p-5">
      {locationLinks.length ? <SidebarSection title="Most searched locations" items={locationLinks} /> : null}
      <SidebarSection title="Recommended searches" items={recommendedSearches} />
      <SidebarSection title="Invest in off-plan" items={offPlanLinks} />
      <SidebarSection title="Top searches by price" items={priceLinks} />
      <SidebarSection title="Top searches by developers" items={developerLinks} />
      </CardContent>
    </Card>
  );
}
