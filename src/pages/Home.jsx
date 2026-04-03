import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import HeroSearch from "@/components/buyer/HeroSearch";
import ListingListRow from "@/components/buyer/ListingListRow";
import AreaSpotlightCard from "@/components/buyer/AreaSpotlightCard";
import StickyInquiryBar from "@/components/buyer/StickyInquiryBar";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import GuideCard from "@/components/content/GuideCard";
import { Button } from "@/components/ui/button";
import useAppConfig from "@/hooks/useAppConfig";
import { isShowcaseListing, loadBuyerListings } from "@/lib/buyerListings";


export default function Home() {
  const { data: appConfig } = useAppConfig();
  const { data: listings = [] } = useQuery({
    queryKey: ["home-listings"],
    queryFn: () => loadBuyerListings({ limit: 4, includeShowcase: true }),
    initialData: []
  });
  const { data: areas = [] } = useQuery({ queryKey: ["home-areas"], queryFn: () => base44.entities.Area.list("-updated_date", 6), initialData: [] });
  const { data: guides = [] } = useQuery({ queryKey: ["home-guides"], queryFn: () => base44.entities.Guide.filter({ status: "published" }, "-updated_date", 3), initialData: [] });
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
  const liveListings = listings.filter((listing) => !isShowcaseListing(listing)).length;

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
        <SectionHeading
          eyebrow="Buyer App"
          title="Verified opportunities presented in a cleaner, list-first format"
          description="The browse layer now behaves more like a proper property application: easy to scan, trust-forward, and less dependent on hidden backend knowledge."
          action={<Button asChild className="rounded-full px-5"><Link to="/properties">Open property directory</Link></Button>}
        />
        {liveListings === 0 && listings.length ? (
          <p className="rounded-[1.6rem] border border-primary/15 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
            Live partner listings are still being populated. The rows below are showcase properties with real imagery so the homepage still feels alive and absorbable.
          </p>
        ) : null}
        {listings.length ? (
          <div className="space-y-5">
            {listings.map((listing) => <ListingListRow key={listing.id} listing={listing} />)}
          </div>
        ) : <p className="text-sm text-muted-foreground">No published listings yet.</p>}
      </section>
      <section className="space-y-6">
        <SectionHeading eyebrow="Area Intelligence" title="Where demand, yield and family fit intersect" description="Area pages become a premium intelligence surface for movers, investors and private clients." />
        {areas.length ? <div className="grid gap-5 md:grid-cols-2">{areas.slice(0,2).map((area) => <AreaSpotlightCard key={area.id} area={area} />)}</div> : <p className="text-sm text-muted-foreground">No area intelligence published yet.</p>}
      </section>
      <section className="space-y-6">
        <SectionHeading eyebrow="Content OS" title="Decision content built to capture and qualify demand" description="Investor guides, relocation content and visa explainers work as acquisition surfaces and downstream qualification tools." />
        {guides.length ? <div className="grid gap-5 md:grid-cols-3">{guides.slice(0,3).map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div> : <p className="text-sm text-muted-foreground">No published guides yet.</p>}
      </section>
      <StickyInquiryBar />
    </div>
  );
}
