import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  CalendarClock,
  CarFront,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutGrid,
  MapPin,
  MessageCircleMore,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import ListingCard from "@/components/buyer/ListingCard";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import SeoMeta from "@/components/seo/SeoMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildListingPath,
  extractListingId,
  extractListingSlug,
  isShowcaseListing,
  loadBuyerListingById,
  loadBuyerListings,
} from "@/lib/buyerListings";
import { findMatchingDeveloperProfile, listDeveloperProfiles } from "@/lib/developerProfiles";
import { findProjectProfileForListing, hydrateProjectProfile, listProjectProfiles } from "@/lib/projectProfiles";
import { buildBreadcrumbJsonLd, truncateSeoDescription } from "@/lib/seo";
import useAppConfig from "@/hooks/useAppConfig";

function formatPrice(value) {
  return `AED ${Number(value || 0).toLocaleString()}`;
}

function humanizeLabel(value, fallback = "Not specified") {
  if (!value) return fallback;
  return String(value).replace(/_/g, " ");
}

function buildWhatsAppUrl(phone, listing) {
  const number = String(phone || "").replace(/[^\d]/g, "");
  if (!number) return "";
  const message = `Hi, I'm interested in ${listing.title}${listing.area_name ? ` in ${listing.area_name}` : ""}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function factItems(listing) {
  return [
    { label: "Property type", value: listing.property_type || "Property", icon: LayoutGrid },
    { label: "Beds", value: listing.bedrooms || 0, icon: BedDouble },
    { label: "Baths", value: listing.bathrooms || 0, icon: Bath },
    { label: "Parking", value: listing.parking_spaces || 0, icon: CarFront },
    { label: "Built-up area", value: `${Number(listing.built_up_area_sqft || 0).toLocaleString()} sqft`, icon: Ruler },
    { label: "Completion", value: listing.is_off_plan ? "Off-Plan" : "Ready", icon: CalendarClock },
  ];
}

function buildListingHighlights(listing, project, developer) {
  return [
    listing.is_off_plan
      ? `This is an off-plan home${project?.handoverLabel ? ` with expected handover in ${project.handoverLabel}.` : "."}`
      : "This home is ready to review now, with price and key details shown up front.",
    listing.floor_plan_available
      ? "A floor plan is available to review."
      : "A floor plan or brochure can be requested from the team.",
    listing.is_private_inventory
      ? "This home is being handled through a more private enquiry process."
      : "This home is part of the public property search and can be enquired on directly.",
    project?.paymentPlanSummary
      ? project.paymentPlanSummary
      : listing.is_off_plan
        ? "Payment plan details can be requested before you shortlist."
        : "The team can help with next steps, pricing, and purchase support.",
    developer?.summary
      ? developer.summary
      : listing.developer_name
        ? `${listing.developer_name} is the developer connected to this property.`
        : "Developer information can be added here once available.",
  ].filter(Boolean).slice(0, 5);
}

function dedupeListings(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function FactTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4 stroke-[2.4]" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function DetailRow({ label, value, action }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 py-3 last:border-b-0 last:pb-0">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
      </div>
      {action}
    </div>
  );
}

export default function ListingDetail() {
  const { id, listingSlugId } = useParams();
  const routeToken = String(listingSlugId || id || "").trim();
  const listingId = extractListingId(routeToken);
  const listingLookup = listingId || extractListingSlug(routeToken);
  const [intentType, setIntentType] = useState("request_callback");
  const [open, setOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { data: appConfig } = useAppConfig();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", routeToken],
    queryFn: async () => loadBuyerListingById(listingLookup),
    enabled: !!listingLookup,
    initialData: null,
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["listing-related-listings", listingId],
    queryFn: () => loadBuyerListings({ limit: 200, includeShowcase: true }),
    initialData: [],
  });
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["listing-detail-developer-profiles"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["listing-detail-project-profiles"],
    queryFn: () => listProjectProfiles(),
    initialData: [],
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["listing-detail-project-records"],
    queryFn: async () => {
      try {
        return await base44.entities.Project.list("-updated_date", 200);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const showcase = isShowcaseListing(listing);
  const projectProfile = listing ? findProjectProfileForListing(listing, projectProfiles) : null;
  const hydratedProject = projectProfile ? hydrateProjectProfile(projectProfile, projects, listings, developerProfiles) : null;
  const developerProfile = listing
    ? findMatchingDeveloperProfile(developerProfiles, listing.developer_name || hydratedProject?.developerName || "")
    : null;
  const publicDeveloper = developerProfile && developerProfile.partnership_status === "partnered" && developerProfile.page_status === "published"
    ? developerProfile
    : null;

  const galleryImages = useMemo(() => {
    if (!listing) return [];
    return Array.from(
      new Set([
        listing.hero_image_url,
        ...(listing.gallery_image_urls || []),
        ...(hydratedProject?.galleryImageUrls || []),
      ].filter(Boolean))
    );
  }, [hydratedProject?.galleryImageUrls, listing]);

  const seoDescription = truncateSeoDescription(
    listing?.description
      || `${listing?.property_type || "Property"} for sale in ${listing?.area_name || "Dubai"}${listing?.developer_name ? ` by ${listing.developer_name}` : ""}.`
  );

  const whatsappUrl = buildWhatsAppUrl(
    publicDeveloper?.contact_phone || hydratedProject?.contactPhone || appConfig.whatsapp_number,
    listing || {}
  );

  const projectListings = hydratedProject?.featuredListings?.filter((item) => item.id !== listing?.id) || [];
  const developerListings = listings
    .filter((item) => item.id !== listing?.id && item.developer_name && item.developer_name === listing?.developer_name)
    .slice(0, 3);
  const areaListings = listings
    .filter((item) => item.id !== listing?.id && item.area_name && item.area_name === listing?.area_name)
    .slice(0, 3);
  const galleryCount = galleryImages.length;
  const listingPath = listing
    ? buildListingPath(listing)
    : listingSlugId
      ? `/properties/${routeToken || "property"}`
      : `/listing/${routeToken || ""}`;
  const projectSearchPath = hydratedProject?.name ? `/properties?q=${encodeURIComponent(hydratedProject.name)}` : "/projects";
  const developerSearchPath = listing?.developer_name ? `/properties?developer=${encodeURIComponent(listing.developer_name)}` : "/properties";
  const areaSearchPath = listing?.area_name ? `/properties?q=${encodeURIComponent(listing.area_name)}` : "/properties";
  const highlights = listing ? buildListingHighlights(listing, hydratedProject, publicDeveloper) : [];
  const connectedRoutes = dedupeListings([...projectListings, ...developerListings, ...areaListings]);

  if (isLoading) {
    return <div className="pb-28 text-sm text-muted-foreground">Loading listing...</div>;
  }

  if (!listing) {
    return (
      <>
        <SeoMeta
          title="Listing Not Found"
          description="The requested property listing could not be found."
          canonicalPath={listingPath}
          robots="noindex,nofollow"
        />
        <div className="pb-28 text-sm text-muted-foreground">This property page is not available right now.</div>
      </>
    );
  }

  return (
    <>
      <SeoMeta
        title={`${listing.title} in ${listing.area_name || "Dubai"}`}
        description={seoDescription}
        canonicalPath={listingPath}
        image={galleryImages[0] || listing.hero_image_url}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
          ...(publicDeveloper?.slug ? [{ name: publicDeveloper.developer_name, path: `/developers/${publicDeveloper.slug}` }] : []),
          ...(hydratedProject?.slug ? [{ name: hydratedProject.name, path: `/projects/${hydratedProject.slug}` }] : []),
          { name: listing.title, path: listingPath },
        ])}
      />

      <div className="space-y-6 pb-28">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="space-y-5">
              <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="relative aspect-[16/11] bg-slate-100">
                    <img
                      src={galleryImages[activeImageIndex] || listing.hero_image_url}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge className={`rounded-full px-3.5 py-1.5 ${listing.is_off_plan ? "bg-slate-950 text-white hover:bg-slate-950" : "bg-emerald-700 text-white hover:bg-emerald-700"}`}>
                        {listing.is_off_plan ? "Off-Plan" : "Ready"}
                      </Badge>
                      <Badge className="rounded-full border border-white/60 bg-white/90 px-3.5 py-1.5 text-slate-900 hover:bg-white">
                        {listing.property_type || "Property"}
                      </Badge>
                      {listing.is_private_inventory ? (
                        <Badge className="rounded-full bg-amber-900/90 px-3.5 py-1.5 text-white hover:bg-amber-900/90">
                          Private Inventory
                        </Badge>
                      ) : null}
                    </div>

                    {galleryCount > 1 ? (
                      <>
                        <button
                          type="button"
                          aria-label="Previous image"
                          className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
                          onClick={() => setActiveImageIndex((current) => (current - 1 + galleryCount) % galleryCount)}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next image"
                          className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
                          onClick={() => setActiveImageIndex((current) => (current + 1) % galleryCount)}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}

                    <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                      {galleryCount} image{galleryCount === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="hidden border-l border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 lg:flex lg:flex-col lg:justify-between">
                    <div className="space-y-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">At a glance</p>
                      <div>
                        <p className="text-3xl font-semibold tracking-tight text-slate-950">{formatPrice(listing.price)}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {listing.is_off_plan
                            ? "Off-plan property with project details and enquiry options."
                            : "Ready home with direct enquiry options."}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <DetailRow label="Area" value={listing.area_name || "Dubai"} />
                        <DetailRow
                          label="Project"
                          value={hydratedProject?.name || listing.project_name || "Standalone property"}
                          action={hydratedProject?.slug ? (
                            <Button asChild variant="ghost" size="sm" className="rounded-full px-3 text-slate-700">
                              <Link to={`/projects/${hydratedProject.slug}`}>Open</Link>
                            </Button>
                          ) : null}
                        />
                        <DetailRow
                          label="Developer"
                          value={publicDeveloper?.developer_name || listing.developer_name || "On request"}
                          action={publicDeveloper?.slug ? (
                            <Button asChild variant="ghost" size="sm" className="rounded-full px-3 text-slate-700">
                              <Link to={`/developers/${publicDeveloper.slug}`}>Open</Link>
                            </Button>
                          ) : null}
                        />
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Helpful next step</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        You can check the project, view the developer, or contact the team from here.
                      </p>
                    </div>
                  </div>
                </div>

                {galleryCount > 1 ? (
                  <div className="grid gap-2 border-t border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-4 lg:grid-cols-5">
                    {galleryImages.slice(0, 5).map((image, index) => (
                      <button
                        type="button"
                        key={image}
                        onClick={() => setActiveImageIndex(index)}
                        className={`overflow-hidden rounded-[1rem] border ${activeImageIndex === index ? "border-slate-950" : "border-slate-200"}`}
                      >
                        <img src={image} alt={`${listing.title} ${index + 1}`} className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                    Sale only
                  </Badge>
                  {listing.is_off_plan && hydratedProject?.handoverLabel ? (
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                      Handover {hydratedProject.handoverLabel}
                    </Badge>
                  ) : null}
                  {listing.floor_plan_available ? (
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                      Floor plan available
                    </Badge>
                  ) : null}
                  {listing.furnishing_status && listing.furnishing_status !== "all" ? (
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                      {humanizeLabel(listing.furnishing_status)}
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <p className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">{formatPrice(listing.price)}</p>
                  <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                    {listing.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {listing.area_name || "Dubai"}
                    </span>
                    {hydratedProject?.slug ? (
                      <Link to={`/projects/${hydratedProject.slug}`} className="inline-flex items-center gap-1.5 text-slate-950 transition hover:text-primary">
                        <Building2 className="h-4 w-4" />
                        {hydratedProject.name}
                      </Link>
                    ) : null}
                    {publicDeveloper?.slug ? (
                      <Link to={`/developers/${publicDeveloper.slug}`} className="inline-flex items-center gap-1.5 text-slate-950 transition hover:text-primary">
                        <Sparkles className="h-4 w-4" />
                        {publicDeveloper.developer_name}
                      </Link>
                    ) : listing.developer_name ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" />
                        {listing.developer_name}
                      </span>
                    ) : null}
                  </div>
                  <p className="max-w-4xl text-sm leading-7 text-slate-600">
                    {listing.description
                      || hydratedProject?.summary
                      || "View the photos, key property details, and the project behind it before deciding on your next step."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {factItems(listing).map(({ label, value, icon }) => (
                    <FactTile key={label} label={label} value={value} icon={icon} />
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6 lg:p-7">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Why this property stands out</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Why this property stands out</h2>
                  </div>
                  <div className="space-y-3">
                    {highlights.map((item) => (
                      <div key={item} className="rounded-[1.25rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6 lg:p-7">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Purchase snapshot</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Key details</h2>
                  </div>

                  <div className="space-y-1">
                    <DetailRow
                      label="Availability"
                      value={listing.is_private_inventory ? "Private enquiry" : listing.is_off_plan ? "Off-plan property" : "Property for sale"}
                    />
                    <DetailRow
                      label="Project"
                      value={hydratedProject?.name || "No project page linked yet"}
                      action={hydratedProject?.slug ? (
                        <Button asChild variant="ghost" size="sm" className="rounded-full px-3 text-slate-700">
                          <Link to={`/projects/${hydratedProject.slug}`}>Project</Link>
                        </Button>
                      ) : null}
                    />
                    <DetailRow
                      label="Developer"
                      value={publicDeveloper?.developer_name || listing.developer_name || "On request"}
                      action={publicDeveloper?.slug ? (
                        <Button asChild variant="ghost" size="sm" className="rounded-full px-3 text-slate-700">
                          <Link to={`/developers/${publicDeveloper.slug}`}>Developer</Link>
                        </Button>
                      ) : null}
                    />
                    <DetailRow label="Publication" value={humanizeLabel(listing.publication_status, "Published")} />
                    <DetailRow label="Freshness" value={humanizeLabel(listing.freshness_status, "Fresh")} />
                  </div>
                </CardContent>
              </Card>
            </section>

            {hydratedProject ? (
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-6 p-6 lg:p-7">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Project context</p>
                      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{hydratedProject.name}</h2>
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {hydratedProject.summary || "The project page gives buyers a wider view of the development, its timing, and the homes available in it."}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button asChild className="rounded-full px-5">
                        <Link to={`/projects/${hydratedProject.slug}`}>View project</Link>
                      </Button>
                      <Button asChild variant="outline" className="rounded-full px-5">
                        <Link to={projectSearchPath}>View project stock</Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <FactTile icon={CalendarClock} label="Project status" value={humanizeLabel(hydratedProject.status, "Planned")} />
                    <FactTile icon={CalendarClock} label="Handover" value={hydratedProject.handoverLabel || "TBC"} />
                    <FactTile icon={LayoutGrid} label="Unit mix" value={hydratedProject.unitTypes?.slice(0, 2).join(", ") || "Available"} />
                    <FactTile icon={Sparkles} label="Price from" value={formatPrice(hydratedProject.priceFrom)} />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Payment plan</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {hydratedProject.paymentPlanSummary || "Request the project pack for live payment-plan detail and brochure support."}
                      </p>
                    </div>

                    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Developer context</p>
                      <p className="mt-3 text-sm leading-7 text-slate-700">
                        {hydratedProject.developerSummary
                          || publicDeveloper?.summary
                          || `${hydratedProject.developerName || listing.developer_name || "The developer"} is connected to this property.`}
                      </p>
                      {publicDeveloper?.slug ? (
                        <Button asChild variant="ghost" className="mt-3 rounded-full px-0 text-slate-950 hover:bg-transparent">
                          <Link to={`/developers/${publicDeveloper.slug}`}>
                            Open developer page
                            <ArrowUpRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Verification</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Verification details</h2>
                  </div>
                  <div className="space-y-1">
                    <DetailRow label="Permit status" value={listing.permit_verified ? "Verified" : "Pending review"} />
                    <DetailRow label="Project status check" value={listing.project_status_verified ? "Checked" : "Pending review"} />
                    <DetailRow label="Verification band" value={humanizeLabel(listing.trust_band, "Standard")} />
                    <DetailRow label="Publication state" value={humanizeLabel(listing.publication_status, "Published")} />
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Buyer support</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Next steps</h2>
                  </div>
                  <div className="space-y-3">
                    <Button
                      className="h-11 w-full rounded-full"
                      onClick={() => {
                        setIntentType("request_callback");
                        setOpen(true);
                      }}
                    >
                      Request a callback
                    </Button>
                    <Button
                      variant="outline"
                      className="h-11 w-full rounded-full"
                      onClick={() => {
                        setIntentType(listing.is_private_inventory ? "request_private_inventory" : "project_enquiry");
                        setOpen(true);
                      }}
                    >
                      {listing.is_private_inventory ? "Request private access" : "Request brochure"}
                    </Button>
                    <Button asChild variant="ghost" className="h-11 w-full rounded-full">
                      <Link to="/contact">Open contact page</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {projectListings.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">More in the same project</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Available units connected to this launch</h2>
                  </div>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={projectSearchPath}>See project stock</Link>
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {projectListings.slice(0, 3).map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </section>
            ) : null}

            {developerListings.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">More by this developer</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">More from this developer</h2>
                  </div>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={developerSearchPath}>Open developer stock</Link>
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {developerListings.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </section>
            ) : null}

            {areaListings.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Continue in the same area</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Nearby opportunities in {listing.area_name || "Dubai"}</h2>
                  </div>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={areaSearchPath}>Explore the area</Link>
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {areaListings.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </section>
            ) : null}

            {!projectListings.length && !developerListings.length && !areaListings.length && connectedRoutes.length ? (
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Continue exploring</h2>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {connectedRoutes.slice(0, 3).map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Property summary</p>
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">{formatPrice(listing.price)}</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="font-medium text-slate-950">{listing.title}</p>
                    <p>{listing.property_type || "Property"} · {listing.area_name || "Dubai"}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {listing.area_name || "Dubai"}
                  </div>
                  {hydratedProject?.handoverLabel ? (
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      Handover {hydratedProject.handoverLabel}
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Permit {listing.permit_verified ? "verified" : "pending"}
                  </div>
                  {listing.developer_name ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {listing.developer_name}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2.5">
                  <Button
                    className="h-11 rounded-full"
                    onClick={() => {
                      setIntentType("request_callback");
                      setOpen(true);
                    }}
                  >
                    Enquire now
                  </Button>
                  {whatsappUrl ? (
                    <Button asChild variant="outline" className="h-11 rounded-full">
                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                        <MessageCircleMore className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="h-11 rounded-full"
                    onClick={() => {
                      setIntentType(listing.is_private_inventory ? "request_private_inventory" : "project_enquiry");
                      setOpen(true);
                    }}
                  >
                    {listing.is_private_inventory ? "Request private access" : "Request brochure"}
                  </Button>
                  {hydratedProject?.brochureUrl ? (
                    <Button asChild variant="ghost" className="h-11 rounded-full">
                      <a href={hydratedProject.brochureUrl} target="_blank" rel="noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Open brochure
                      </a>
                    </Button>
                  ) : null}
                  <Button asChild variant="ghost" className="h-11 rounded-full">
                    <Link to="/contact">Contact us</Link>
                  </Button>
                </div>

                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Related pages</p>
                  <div className="grid gap-2">
                    {hydratedProject?.slug ? (
                      <Button asChild variant="outline" className="justify-between rounded-full px-4">
                        <Link to={`/projects/${hydratedProject.slug}`}>
                          Project page
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    {publicDeveloper?.slug ? (
                      <Button asChild variant="outline" className="justify-between rounded-full px-4">
                        <Link to={`/developers/${publicDeveloper.slug}`}>
                          Developer page
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" className="justify-between rounded-full px-4">
                      <Link to={areaSearchPath}>
                        Area search
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>

      <BuyerIntentSheet
        open={open}
        onOpenChange={setOpen}
        intentType={intentType}
        listingId={showcase ? "" : (listing.record_id || listing.id)}
        projectId={hydratedProject?.projectId || ""}
        title={listing.title}
      />
    </>
  );
}
