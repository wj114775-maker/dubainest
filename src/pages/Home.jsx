import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Gem,
  Globe2,
  KeyRound,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import HeroSearch from "@/components/buyer/HeroSearch";
import PopularSearchHub from "@/components/buyer/PopularSearchHub";
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
import { buildOrganizationJsonLd, buildRealEstateAgentJsonLd, buildWebsiteJsonLd } from "@/lib/seo";

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

const trustSignals = [
  {
    title: "Search-first, not portal-cluttered",
    description: "The public site stays focused on Dubai property purchase, off-plan, and private inventory rather than noisy marketplace mechanics.",
    icon: Search,
  },
  {
    title: "Developer-aligned purchase support",
    description: "Projects, developers, and listings are structured to support informed acquisition and direct advisory execution.",
    icon: ShieldCheck,
  },
  {
    title: "Private client capability built in",
    description: "Golden Visa, premium buyer handling, and discreet inventory workflows sit inside the same governed business system.",
    icon: CheckCircle2,
  },
];

const purchaseSteps = [
  {
    step: "01",
    title: "Search with clarity",
    description: "Start with areas, developers, projects, or direct sale stock without being pushed through unnecessary registration first.",
  },
  {
    step: "02",
    title: "Shortlist with context",
    description: "Move from listings into project and developer pages, compare relevant stock, and narrow the right purchase route.",
  },
  {
    step: "03",
    title: "Secure with advisory support",
    description: "When ready, shift into guided enquiry, private inventory handling, brochure review, and purchase preparation.",
  },
];

const advisoryHighlights = [
  "Direct developer-aligned buyer handling",
  "Off-plan, private inventory, and Golden Visa support",
  "WhatsApp-first advisory with governed follow-through",
  "Structured progression from search to purchase readiness",
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
        jsonLd={[buildOrganizationJsonLd(), buildRealEstateAgentJsonLd(), buildWebsiteJsonLd()]}
      />
      <div className="space-y-10 pb-32">
        <HeroSearch appName={appConfig.app_name} metrics={homeMetrics} />

        <section className="rounded-[2rem] border border-slate-200 bg-slate-100/90 p-5 shadow-sm shadow-black/5 lg:p-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {trustSignals.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[1.5rem] border border-white/70 bg-white/90 p-5 shadow-sm shadow-black/5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-slate-950 text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold tracking-tight text-foreground">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_440px] xl:items-stretch">
          <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
            <CardContent className="space-y-6 p-6 lg:p-7">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">How it works</p>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">A cleaner path from search to secure purchase</h2>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  The public experience is designed to feel clear and premium, while the harder operational work stays behind the scenes in the Back Office.
                </p>
              </div>

              <div className="space-y-4">
                {purchaseSteps.map((item) => (
                  <div key={item.step} className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-background/70 p-4 md:grid-cols-[72px_minmax(0,1fr)] md:items-start">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-xl shadow-black/10">
            <div className="relative h-full min-h-[24rem]">
              <img
                src="https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=80"
                alt="Dubai skyline and premium residential towers"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,24,0.15),rgba(8,14,24,0.78))]" />
              <div className="relative flex h-full flex-col justify-end p-6 text-white lg:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">Market positioning</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight">Premium search outside. Governed execution underneath.</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/78">
                  Buyers see a cleaner public experience. Internal teams manage the developer, project, listing, and advisory workflow behind it.
                </p>
              </div>
            </div>
          </div>
        </section>

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

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/95 shadow-xl shadow-black/5">
          <div className="grid gap-0 lg:grid-cols-[390px_minmax(0,1fr)]">
            <div className="relative min-h-[20rem]">
              <img
                src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80"
                alt="Luxury residential interior suited to premium Dubai property marketing"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,16,28,0.12),rgba(9,16,28,0.36))]" />
            </div>

            <div className="space-y-6 p-6 lg:p-8">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Advisory desk</p>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">Speak to a team that handles purchase execution, not just listing discovery</h2>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Use DubaiSphere when you want a cleaner path into project selection, off-plan assessment, private inventory routing, and buyer readiness support.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {advisoryHighlights.map((item) => (
                  <div key={item} className="inline-flex items-start gap-3 rounded-[1.3rem] border border-white/10 bg-background/70 px-4 py-4 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="rounded-full px-5" onClick={() => setIntentConfig({ open: true, type: "request_callback", title: "Business dealings" })}>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Speak to advisory
                </Button>
                <Button asChild variant="outline" className="rounded-full px-5">
                  <Link to="/contact">
                    Contact DubaiSphere
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <PopularSearchHub />

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
