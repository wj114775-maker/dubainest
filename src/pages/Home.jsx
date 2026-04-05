import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Gem,
  Globe2,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import HeroSearch from "@/components/buyer/HeroSearch";
import SeoMeta from "@/components/seo/SeoMeta";
import AreaSpotlightCard from "@/components/buyer/AreaSpotlightCard";
import DeveloperSpotlightCard from "@/components/buyer/DeveloperSpotlightCard";
import ProjectSpotlightCard from "@/components/buyer/ProjectSpotlightCard";
import StickyInquiryBar from "@/components/buyer/StickyInquiryBar";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import SectionHeading from "@/components/common/SectionHeading";
import GuideCard from "@/components/content/GuideCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import useAppConfig from "@/hooks/useAppConfig";
import { loadBuyerListings } from "@/lib/buyerListings";
import { buildManagedDeveloperDirectory, listDeveloperProfiles } from "@/lib/developerProfiles";
import { buildManagedProjectDirectory, listProjectProfiles } from "@/lib/projectProfiles";
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from "@/lib/seo";

const pathCards = [
  {
    title: "Property purchase",
    description: "Open the list-first property directory built for clean buying decisions.",
    path: "/properties",
    action: "Browse listings",
    icon: Building2,
  },
  {
    title: "Off-Plan opportunities",
    description: "Jump directly into future-delivery stock with dedicated off-plan badging and filters.",
    path: "/projects",
    action: "View off-plan",
    icon: Sparkles,
  },
  {
    title: "Private inventory",
    description: "Request access to discreet stock, concierge handling, and private client workflows.",
    action: "Request access",
    icon: Gem,
    intentType: "request_private_inventory",
  },
  {
    title: "Golden Visa",
    description: "Start with the residency pathway and let property discovery follow the right route.",
    path: "/golden-visa",
    action: "Start assessment",
    icon: Globe2,
  },
  {
    title: "Guides and research",
    description: "Use area intelligence, investment content, and relocation guides before committing.",
    path: "/guides",
    action: "Open guides",
    icon: BookOpen,
  },
  {
    title: "Business dealings",
    description: "Speak to the team about investment support, partner-led execution, or premium deal handling.",
    action: "Speak to advisory",
    icon: BriefcaseBusiness,
    intentType: "request_callback",
  },
];

export default function Home() {
  const { data: appConfig } = useAppConfig();
  const { data: approvedDevelopers = [] } = useApprovedDevelopers();
  const [intentConfig, setIntentConfig] = useState({ open: false, type: "request_callback", title: "Request a callback" });

  const { data: areas = [] } = useQuery({ queryKey: ["home-areas"], queryFn: () => base44.entities.Area.list("-updated_date", 6), initialData: [] });
  const { data: guides = [] } = useQuery({ queryKey: ["home-guides"], queryFn: () => base44.entities.Guide.filter({ status: "published" }, "-updated_date", 3), initialData: [] });
  const { data: homeListings = [] } = useQuery({
    queryKey: ["home-developer-listings"],
    queryFn: () => loadBuyerListings({ limit: 120, includeShowcase: true }),
    initialData: [],
  });
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["home-developer-profiles"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["home-project-profiles"],
    queryFn: () => listProjectProfiles(),
    initialData: [],
  });
  const { data: projectRecords = [] } = useQuery({
    queryKey: ["home-project-records"],
    queryFn: async () => {
      try {
        return await base44.entities.Project.list("-updated_date", 100);
      } catch {
        return [];
      }
    },
    initialData: [],
  });
  const { data: homeMetrics } = useQuery({
    queryKey: ["home-metrics"],
    queryFn: async () => {
      const [allListings, agencies] = await Promise.all([
        base44.entities.Listing.list("-updated_date", 200),
        base44.entities.PartnerAgency.list("-updated_date", 200),
      ]);

      const publishedListings = allListings.filter((item) => item.status === "published" && item.listing_type !== "rent");
      const verifiedListings = publishedListings.filter((item) => item.permit_verified).length;
      const offPlanListings = publishedListings.filter((item) => item.completion_status === "off_plan").length;
      const activePartners = agencies.filter((item) => item.status === "active");
      const privateInventoryListings = publishedListings.filter((item) => item.is_private_inventory).length;
      const developerCounts = publishedListings.reduce((accumulator, item) => {
        const name = String(item.developer_name || "").trim();
        if (!name) return accumulator;
        accumulator[name] = (accumulator[name] || 0) + 1;
        return accumulator;
      }, {});
      const topDeveloperNames = Object.entries(developerCounts)
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, 50)
        .map(([name]) => name);

      return {
        verifiedListings,
        offPlanListings,
        activePartners: activePartners.length,
        privateInventoryListings,
        topDeveloperNames,
      };
    },
    initialData: { verifiedListings: 0, offPlanListings: 0, activePartners: 0, privateInventoryListings: 0, topDeveloperNames: [] },
  });

  const featuredGuideSet = useMemo(() => guides.slice(0, 3), [guides]);
  const featuredAreas = useMemo(() => areas.slice(0, 2), [areas]);
  const featuredDevelopers = useMemo(
    () => buildManagedDeveloperDirectory(developerProfiles, approvedDevelopers, homeListings, { homepageOnly: true }).slice(0, 3),
    [approvedDevelopers, developerProfiles, homeListings]
  );
  const featuredProjects = useMemo(
    () => buildManagedProjectDirectory(projectProfiles, projectRecords, homeListings, developerProfiles, { homepageOnly: true }).slice(0, 3),
    [developerProfiles, homeListings, projectProfiles, projectRecords]
  );

  return (
    <>
      <SeoMeta
        title="Dubai Properties for Sale, Off-Plan and Private Inventory"
        description="Search Dubai properties for sale, compare off-plan opportunities, and request curated private inventory through one buyer-focused journey."
        canonicalPath="/"
        jsonLd={[buildOrganizationJsonLd(), buildWebsiteJsonLd()]}
      />
      <div className="space-y-10 pb-32">
        <HeroSearch appName={appConfig.app_name} metrics={homeMetrics} />

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Beyond search"
            title="Continue with curated routes when the buyer is not ready for direct search"
            description="The homepage now starts with sale search. These routes stay below it for private inventory, visa-led journeys, guides, and advisory support."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {pathCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
                  <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                    <div className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    {item.path ? (
                      <Button asChild className="w-full rounded-full">
                        <Link to={item.path}>{item.action}</Link>
                      </Button>
                    ) : (
                      <Button
                        className="w-full rounded-full"
                        onClick={() => setIntentConfig({ open: true, type: item.intentType, title: item.title })}
                      >
                        {item.action}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Area intelligence"
            title="Start with the neighbourhood if the location decision comes first"
            description="Area pages stay visible from the overview page because many buyers decide by location before they decide by stock."
            action={
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to="/areas">View all areas</Link>
              </Button>
            }
          />
          {featuredAreas.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {featuredAreas.map((area) => <AreaSpotlightCard key={area.id} area={area} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No area intelligence published yet.</p>
          )}
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Developer directory"
            title="Move from brand trust into active opportunities"
            description="Only developers you actively publish appear here, so the public only sees partnered brand pages and controlled profile content."
            action={
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to="/developers">View all developers</Link>
              </Button>
            }
          />
          {featuredDevelopers.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredDevelopers.map((developer) => <DeveloperSpotlightCard key={developer.slug} developer={developer} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No featured developer pages are live yet.</p>
          )}
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Project launches"
            title="Use project pages for launches, handover timing, and available stock context"
            description="Project pages sit between developer trust and listing-level choice. They are the right place for launch context, payment-plan language, and linked unit discovery."
            action={
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to="/projects">View all projects</Link>
              </Button>
            }
          />
          {featuredProjects.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {featuredProjects.map((project) => <ProjectSpotlightCard key={project.slug} project={project} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No featured project pages are live yet.</p>
          )}
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Guides"
            title="Research and guidance remain a first-class entry route"
            description="Keep content visible on the Explore page so buyers who are not ready for property search can still progress intelligently."
          />
          {featuredGuideSet.length ? (
            <div className="grid gap-5 md:grid-cols-3">
              {featuredGuideSet.map((guide) => <GuideCard key={guide.id} guide={guide} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No published guides yet.</p>
          )}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-card/95 p-6 shadow-xl shadow-black/5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Purchase pathway</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">When the buyer is ready, send them into the property directory</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                The property page now carries the heavier Bayut-style filter work. Explore stays lighter and acts as the business overview page.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="rounded-full px-5">
                <Link to="/properties">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Open property directory
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to="/properties?completion=off_plan">View off-plan only</Link>
              </Button>
            </div>
          </div>
        </section>

        <StickyInquiryBar />
      </div>

      <BuyerIntentSheet
        open={intentConfig.open}
        onOpenChange={(open) => setIntentConfig((current) => ({ ...current, open }))}
        intentType={intentConfig.type}
        title={intentConfig.title}
      />
    </>
  );
}
