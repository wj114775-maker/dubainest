import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bath,
  BedDouble,
  Building2,
  CalendarClock,
  CarFront,
  ChevronLeft,
  ChevronRight,
  FileText,
  MapPin,
  MessageCircleMore,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MetricCard from "@/components/common/MetricCard";
import SeoMeta from "@/components/seo/SeoMeta";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import ListingCard from "@/components/buyer/ListingCard";
import { isShowcaseListing, loadBuyerListingById, loadBuyerListings } from "@/lib/buyerListings";
import { buildBreadcrumbJsonLd, truncateSeoDescription } from "@/lib/seo";
import { findMatchingDeveloperProfile, listDeveloperProfiles } from "@/lib/developerProfiles";
import { findProjectProfileForListing, hydrateProjectProfile, listProjectProfiles } from "@/lib/projectProfiles";
import useAppConfig from "@/hooks/useAppConfig";

function factItems(listing) {
  return [
    { label: "Beds", value: listing.bedrooms || 0, icon: BedDouble },
    { label: "Baths", value: listing.bathrooms || 0, icon: Bath },
    { label: "Parking", value: listing.parking_spaces || 0, icon: CarFront },
    { label: "Size", value: `${Number(listing.built_up_area_sqft || 0).toLocaleString()} sqft`, icon: Ruler },
  ];
}

function formatPrice(value) {
  return `AED ${Number(value || 0).toLocaleString()}`;
}

function buildWhatsAppUrl(phone, listing) {
  const number = String(phone || "").replace(/[^\d]/g, "");
  if (!number) return "";
  const message = `Hi, I'm interested in ${listing.title}${listing.area_name ? ` in ${listing.area_name}` : ""}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function ListingDetail() {
  const { id } = useParams();
  const [intentType, setIntentType] = useState("request_callback");
  const [open, setOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { data: appConfig } = useAppConfig();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => loadBuyerListingById(id),
    enabled: !!id,
    initialData: null,
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["listing-related-listings", id],
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
  const developerProfile = listing ? findMatchingDeveloperProfile(developerProfiles, listing.developer_name || hydratedProject?.developerName || "") : null;
  const publicDeveloper = developerProfile && developerProfile.partnership_status === "partnered" && developerProfile.page_status === "published"
    ? developerProfile
    : null;
  const galleryImages = useMemo(() => {
    if (!listing) return [];
    return Array.from(new Set([listing.hero_image_url, ...(listing.gallery_image_urls || []), ...(hydratedProject?.galleryImageUrls || [])].filter(Boolean)));
  }, [hydratedProject?.galleryImageUrls, listing]);
  const seoDescription = truncateSeoDescription(
    listing?.description
      || `${listing?.property_type || "Property"} for sale in ${listing?.area_name || "Dubai"}${listing?.developer_name ? ` by ${listing.developer_name}` : ""}.`
  );
  const whatsappUrl = buildWhatsAppUrl(publicDeveloper?.contact_phone || hydratedProject?.contactPhone || appConfig.whatsapp_number, listing || {});
  const relatedByProject = hydratedProject?.featuredListings?.filter((item) => item.id !== listing?.id) || [];
  const relatedListings = relatedByProject.length
    ? relatedByProject.slice(0, 3)
    : listings.filter((item) => item.id !== listing?.id && (
      (hydratedProject?.name && item.project_name === hydratedProject.name)
      || (listing?.developer_name && item.developer_name === listing.developer_name)
      || (listing?.area_name && item.area_name === listing.area_name)
    )).slice(0, 3);

  if (isLoading) {
    return <div className="pb-28 text-sm text-muted-foreground">Loading listing...</div>;
  }

  if (!listing) {
    return (
      <>
        <SeoMeta
          title="Listing Not Found"
          description="The requested property listing could not be found."
          canonicalPath={`/listing/${id}`}
          robots="noindex,nofollow"
        />
        <div className="pb-28 text-sm text-muted-foreground">Listing not found.</div>
      </>
    );
  }

  return (
    <>
      <SeoMeta
        title={`${listing.title} in ${listing.area_name || "Dubai"}`}
        description={seoDescription}
        canonicalPath={`/listing/${id}`}
        image={galleryImages[0] || listing.hero_image_url}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
          ...(hydratedProject?.slug ? [{ name: hydratedProject.name, path: `/projects/${hydratedProject.slug}` }] : []),
          { name: listing.title, path: `/listing/${id}` },
        ])}
      />

      <div className="space-y-6 pb-28">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/90">
              <div className="relative aspect-[16/10] bg-muted">
                <img src={galleryImages[activeImageIndex] || listing.hero_image_url} alt={listing.title} className="h-full w-full object-cover" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge className={`rounded-full ${listing.is_off_plan ? "bg-slate-950 text-white hover:bg-slate-950" : "bg-emerald-700 text-white hover:bg-emerald-700"}`}>
                    {listing.is_off_plan ? "Off-Plan" : "Ready"}
                  </Badge>
                  <Badge className="rounded-full border border-slate-200 bg-white text-slate-900 hover:bg-white">
                    {listing.property_type || "Property"}
                  </Badge>
                  {listing.is_private_inventory ? (
                    <Badge className="rounded-full bg-emerald-800 text-white hover:bg-emerald-800">Private Inventory</Badge>
                  ) : null}
                </div>
                {galleryImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
                      onClick={() => setActiveImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length)}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
                      onClick={() => setActiveImageIndex((current) => (current + 1) % galleryImages.length)}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                ) : null}
              </div>
              {galleryImages.length > 1 ? (
                <div className="grid gap-2 border-t border-white/10 p-3 sm:grid-cols-4">
                  {galleryImages.slice(0, 4).map((image, index) => (
                    <button
                      type="button"
                      key={image}
                      onClick={() => setActiveImageIndex(index)}
                      className={`overflow-hidden rounded-[1rem] border ${activeImageIndex === index ? "border-slate-950" : "border-white/10"}`}
                    >
                      <img src={image} alt={`${listing.title} ${index + 1}`} className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-4xl font-semibold tracking-tight text-foreground">{formatPrice(listing.price)}</p>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{listing.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {listing.area_name || "Dubai"}
                  </span>
                  {hydratedProject?.slug ? (
                    <Link to={`/projects/${hydratedProject.slug}`} className="inline-flex items-center gap-1.5 text-foreground hover:text-primary">
                      <Building2 className="h-4 w-4" />
                      {hydratedProject.name}
                    </Link>
                  ) : null}
                  {publicDeveloper?.slug ? (
                    <Link to={`/developers/${publicDeveloper.slug}`} className="inline-flex items-center gap-1.5 text-foreground hover:text-primary">
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
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {factItems(listing).map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-[1.1rem] border border-white/10 bg-card/80 px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon className="h-4 w-4 stroke-[2.45]" />
                      <span className="text-[11px] uppercase tracking-[0.22em]">{label}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {hydratedProject ? (
              <Card className="rounded-[1.8rem] border-white/10 bg-card/90">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-primary">Project context</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{hydratedProject.name}</h2>
                    </div>
                    <Button asChild variant="outline" className="rounded-full px-5">
                      <Link to={`/projects/${hydratedProject.slug}`}>View project</Link>
                    </Button>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {hydratedProject.summary || "Project context, launch positioning, and handover timing are managed separately from the unit page so the listing can stay focused on conversion."}
                  </p>
                  <div className="grid gap-4 md:grid-cols-4">
                    <MetricCard label="Project status" value={String(hydratedProject.status).replace(/_/g, " ")} />
                    <MetricCard label="Handover" value={hydratedProject.handoverLabel || "TBC"} />
                    <MetricCard label="Price from" value={formatPrice(hydratedProject.priceFrom)} />
                    <MetricCard label="Unit mix" value={hydratedProject.unitTypes?.slice(0, 2).join(", ") || "Available"} />
                  </div>
                  {hydratedProject.paymentPlanSummary ? (
                    <div className="rounded-[1.2rem] border border-white/10 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Payment plan</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{hydratedProject.paymentPlanSummary}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-[1.8rem] border-white/10 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Listing details</h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  {listing.description || "Full listing narrative will appear here once the property notes are finalised."}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[1.8rem] border-white/10 bg-card/90">
              <CardContent className="space-y-4 p-6">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Verification and publication</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.2rem] border border-white/10 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Permit</p>
                    <p className="mt-2 font-semibold text-foreground">{listing.permit_verified ? "Verified" : "Pending"}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Project status</p>
                    <p className="mt-2 font-semibold text-foreground">{listing.project_status_verified ? "Checked" : "Pending"}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Freshness</p>
                    <p className="mt-2 font-semibold text-foreground">{String(listing.freshness_status || "fresh").replace(/_/g, " ")}</p>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-background/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Publication</p>
                    <p className="mt-2 font-semibold text-foreground">{String(listing.publication_status || "published").replace(/_/g, " ")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {relatedListings.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Related opportunities</h2>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={hydratedProject?.slug ? `/projects/${hydratedProject.slug}` : "/properties"}>Continue exploring</Link>
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {relatedListings.map((item) => (
                    <ListingCard key={item.id} listing={item} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Purchase support</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{formatPrice(listing.price)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {listing.property_type || "Property"} · {listing.area_name || "Dubai"}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
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
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {listing.area_name || "Dubai"}
                  </div>
                  {listing.developer_name ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {listing.developer_name}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      setIntentType("request_callback");
                      setOpen(true);
                    }}
                  >
                    Enquire now
                  </Button>
                  {whatsappUrl ? (
                    <Button asChild variant="outline" className="rounded-full">
                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                        <MessageCircleMore className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => {
                      setIntentType(listing.is_private_inventory ? "request_private_inventory" : "request_callback");
                      setOpen(true);
                    }}
                  >
                    {listing.is_private_inventory ? "Request private access" : "Request callback"}
                  </Button>
                  {hydratedProject?.brochureUrl ? (
                    <Button asChild variant="ghost" className="rounded-full">
                      <a href={hydratedProject.brochureUrl} target="_blank" rel="noreferrer">
                        <FileText className="mr-2 h-4 w-4" />
                        Open brochure
                      </a>
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="rounded-full"
                      onClick={() => {
                        setIntentType("project_enquiry");
                        setOpen(true);
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Request brochure
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BuyerIntentSheet
        open={open}
        onOpenChange={setOpen}
        intentType={intentType}
        listingId={showcase ? "" : listing.id}
        projectId={hydratedProject?.projectId || ""}
        title={listing.title}
      />
    </>
  );
}
