import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import HeroSearch from "@/components/buyer/HeroSearch";
import ListingCard from "@/components/buyer/ListingCard";
import AreaSpotlightCard from "@/components/buyer/AreaSpotlightCard";
import StickyInquiryBar from "@/components/buyer/StickyInquiryBar";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import GuideCard from "@/components/content/GuideCard";
import useAppConfig from "@/hooks/useAppConfig";

const fallbackListings = [
  { id: "l1", title: "Verified Marina Residence", property_type: "Apartment", area_name: "Dubai Marina", bedrooms: 2, price: 2450000, trust_score: 91, listing_type: "sale", hero_image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80" },
  { id: "l2", title: "Palm Signature Villa", property_type: "Villa", area_name: "Palm Jumeirah", bedrooms: 5, price: 18750000, trust_score: 95, listing_type: "private_inventory", hero_image_url: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80" },
  { id: "l3", title: "Downtown Investor Suite", property_type: "Apartment", area_name: "Downtown Dubai", bedrooms: 1, price: 1980000, trust_score: 84, listing_type: "sale", hero_image_url: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80" }
];

const fallbackAreas = [
  { id: "a1", name: "Dubai Hills Estate", avg_rental_yield: 6.2, family_score: 90, investor_score: 82, description: "Master-planned green luxury with strong owner-occupier demand.", hero_image_url: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80" },
  { id: "a2", name: "Jumeirah Village Circle", avg_rental_yield: 7.4, family_score: 75, investor_score: 88, description: "High-velocity inventory and yield-driven investor interest.", hero_image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80" }
];

const fallbackGuides = [
  { id: "g1", category: "golden_visa", title: "Dubai Golden Visa for property buyers", excerpt: "Qualification triggers, evidence flow and when to escalate to concierge." },
  { id: "g2", category: "relocation", title: "Relocating a family to Dubai", excerpt: "Schools, communities, visas and move-in planning in one operating flow." },
  { id: "g3", category: "investing", title: "How to judge listing trust before enquiry", excerpt: "Read permit, broker and project signals before you share your details." }
];

export default function Home() {
  const { data: appConfig } = useAppConfig();
  const { data: listings = fallbackListings } = useQuery({ queryKey: ["home-listings"], queryFn: () => base44.entities.Listing.filter({ status: "published" }, "-updated_date", 6), initialData: fallbackListings });
  const { data: areas = fallbackAreas } = useQuery({ queryKey: ["home-areas"], queryFn: () => base44.entities.Area.list(), initialData: fallbackAreas });
  const { data: guides = fallbackGuides } = useQuery({ queryKey: ["home-guides"], queryFn: () => base44.entities.Guide.filter({ status: "published" }, "-updated_date", 3), initialData: fallbackGuides });
  const { data: homeMetrics } = useQuery({
    queryKey: ["home-metrics"],
    queryFn: async () => {
      const [allListings, agencies] = await Promise.all([
        base44.entities.Listing.list("-updated_date", 200),
        base44.entities.PartnerAgency.list("-updated_date", 200),
      ]);

      const verifiedListings = allListings.filter((item) => item.status === "published" && item.permit_verified).length;
      const activePartners = agencies.filter((item) => item.status === "active");
      const averageTrust = allListings.length
        ? Math.round(allListings.reduce((sum, item) => sum + Number(item.trust_score || 0), 0) / allListings.length)
        : 0;
      const callbackSla = activePartners.length
        ? Math.round(activePartners.reduce((sum, item) => sum + Number(item.sla_response_minutes || 0), 0) / activePartners.length)
        : 0;

      return { verifiedListings, activePartners: activePartners.length, averageTrust, callbackSla };
    },
    initialData: { verifiedListings: 0, activePartners: 0, averageTrust: 0, callbackSla: 0 },
  });

  return (
    <div className="space-y-10 pb-32">
      <HeroSearch appName={appConfig.app_name} />
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Verified active listings" value={String(homeMetrics.verifiedListings)} hint="Permit-aware publishing only" />
        <MetricCard label="Partner agencies" value={String(homeMetrics.activePartners)} hint="Licensed execution partners" />
        <MetricCard label="Average trust score" value={`${homeMetrics.averageTrust}/100`} hint="Listing + partner + broker weighted" />
        <MetricCard label="Callback SLA" value={homeMetrics.callbackSla ? `${homeMetrics.callbackSla} min` : "—"} hint="Tracked across partner OS" />
      </section>
      <section className="space-y-6">
        <SectionHeading eyebrow="Buyer App" title="Verified opportunities with enterprise trust signals" description="Listings are screened for permit evidence, broker verification, duplicate risk and stale inventory before publishing." />
        <div className="grid gap-5 md:grid-cols-3">{listings.slice(0,3).map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div>
      </section>
      <section className="space-y-6">
        <SectionHeading eyebrow="Area Intelligence" title="Where demand, yield and family fit intersect" description="Area pages become a premium intelligence surface for movers, investors and private clients." />
        <div className="grid gap-5 md:grid-cols-2">{areas.slice(0,2).map((area) => <AreaSpotlightCard key={area.id} area={area} />)}</div>
      </section>
      <section className="space-y-6">
        <SectionHeading eyebrow="Content OS" title="Decision content built to capture and qualify demand" description="Investor guides, relocation content and visa explainers work as acquisition surfaces and downstream qualification tools." />
        <div className="grid gap-5 md:grid-cols-3">{guides.slice(0,3).map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div>
      </section>
      <StickyInquiryBar />
    </div>
  );
}