import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers3,
  MapPin,
  MessageCircleMore,
  Sparkles,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import ListingCard from "@/components/buyer/ListingCard";
import SeoMeta from "@/components/seo/SeoMeta";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadBuyerListings } from "@/lib/buyerListings";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { getProjectProfileBySlug, hydrateProjectProfile } from "@/lib/projectProfiles";
import { buildBreadcrumbJsonLd, truncateSeoDescription } from "@/lib/seo";
import useAppConfig from "@/hooks/useAppConfig";

function formatProjectStatus(status) {
  return String(status || "planned").replace(/_/g, " ");
}

function formatPrice(value) {
  if (!value) return "On request";
  return `AED ${Number(value).toLocaleString()}`;
}

function buildWhatsAppUrl(phone, project) {
  const number = String(phone || "").replace(/[^\d]/g, "");
  if (!number) return "";
  const message = `Hi, I'm interested in ${project.name}${project.areaName ? ` in ${project.areaName}` : ""}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const [open, setOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { data: appConfig } = useAppConfig();

  const { data: profile } = useQuery({
    queryKey: ["project-profile", slug],
    queryFn: () => getProjectProfileBySlug(slug),
    enabled: !!slug,
    initialData: null,
  });
  const { data: developerProfiles = [] } = useQuery({
    queryKey: ["project-detail-developer-profiles"],
    queryFn: () => listDeveloperProfiles(),
    initialData: [],
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["project-detail-listings", slug],
    queryFn: () => loadBuyerListings({ limit: 200, includeShowcase: true }),
    initialData: [],
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["project-detail-records", slug],
    queryFn: async () => {
      try {
        return await base44.entities.Project.list("-updated_date", 200);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const project = profile && profile.page_status === "published"
    ? hydrateProjectProfile(profile, projects, listings, developerProfiles)
    : null;

  const galleryImages = useMemo(
    () => project?.galleryImageUrls?.length ? project.galleryImageUrls : [project?.heroImageUrl].filter(Boolean),
    [project]
  );
  const relatedListings = project?.featuredListings || [];
  const whatsappUrl = buildWhatsAppUrl(project?.contactPhone || appConfig.whatsapp_number, project || {});

  if (!project) {
    return (
      <>
        <SeoMeta
          title="Project Not Found"
          description="The requested project page could not be found."
          canonicalPath={`/projects/${slug}`}
          robots="noindex,nofollow"
        />
        <div className="pb-28 text-sm text-muted-foreground">Project page not found.</div>
      </>
    );
  }

  return (
    <>
      <SeoMeta
        title={project.seoTitle || `${project.name} Dubai Project Overview`}
        description={truncateSeoDescription(project.seoDescription || project.summary || `Review ${project.name} in ${project.areaName} with handover, price, and linked property information.`)}
        canonicalPath={`/projects/${slug}`}
        robots="index,follow"
        image={project.heroImageUrl}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Projects", path: "/projects" },
          { name: project.name, path: `/projects/${slug}` },
        ])}
      />

      <div className="space-y-6 pb-28">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/90">
              <div className="relative aspect-[16/10] bg-muted">
                <img src={galleryImages[activeImageIndex] || project.heroImageUrl} alt={project.name} className="h-full w-full object-cover" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge className="rounded-full bg-slate-950 text-white hover:bg-slate-950">{formatProjectStatus(project.status)}</Badge>
                  <Badge className="rounded-full border border-slate-200 bg-white text-slate-900 hover:bg-white">
                    {project.unitTypes?.slice(0, 2).join(", ") || "Project"}
                  </Badge>
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
                      <img src={image} alt={`${project.name} ${index + 1}`} className="h-20 w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <SectionHeading
              eyebrow="Project overview"
              title={project.name}
              description={project.summary || `Status: ${formatProjectStatus(project.status)} · Handover ${project.handoverLabel}`}
              action={(
                <div className="flex gap-3">
                  {project.developerSlug ? (
                    <Button asChild variant="outline" className="rounded-full px-5">
                      <Link to={`/developers/${project.developerSlug}`}>View developer</Link>
                    </Button>
                  ) : null}
                  <Button className="rounded-full px-5" onClick={() => setOpen(true)}>Request brochure</Button>
                </div>
              )}
            />

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Price from {formatPrice(project.priceFrom)}</Badge>
              <Badge variant="outline">Handover {project.handoverLabel}</Badge>
              {project.bedroomRange ? <Badge variant="outline">Bedrooms {project.bedroomRange}</Badge> : null}
              {project.areaName ? <Badge variant="outline">{project.areaName}</Badge> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Project status" value={formatProjectStatus(project.status)} />
              <MetricCard label="Price from" value={formatPrice(project.priceFrom)} />
              <MetricCard label="Area" value={project.areaName || "Dubai"} />
              <MetricCard label="Unit mix" value={project.unitTypes?.length ? project.unitTypes.slice(0, 2).join(", ") : "Available"} />
            </div>

            {project.body ? (
              <Card className="rounded-[1.8rem] border-white/10 bg-card/90">
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Project story</h2>
                  <p className="text-sm leading-7 text-muted-foreground">{project.body}</p>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="rounded-[1.8rem] border-white/10 bg-card/90">
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Payment plan</h2>
                  <p className="text-sm leading-7 text-muted-foreground">
                    {project.paymentPlanSummary || "Request the brochure for the current payment-plan structure and launch pack."}
                  </p>
                </CardContent>
              </Card>
              <Card className="rounded-[1.8rem] border-white/10 bg-card/90">
                <CardContent className="space-y-4 p-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Highlights</h2>
                  {project.amenityHighlights?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {project.amenityHighlights.map((item) => (
                        <Badge key={item} variant="outline" className="rounded-full">{item}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-7 text-muted-foreground">Add amenity highlights in the project page manager to keep this block factual and launch-specific.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {relatedListings.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">Available properties in this project</h2>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={`/properties?q=${encodeURIComponent(project.name)}`}>Open property directory</Link>
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {relatedListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
              <CardContent className="space-y-4 p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Project launch</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{formatPrice(project.priceFrom)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {project.developerName ? `${project.developerName} · ` : ""}{project.areaName || "Dubai"}
                  </p>
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Handover {project.handoverLabel}
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers3 className="h-4 w-4" />
                    {project.unitTypes?.slice(0, 3).join(", ") || "Project inventory"}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {project.areaName || "Dubai"}
                  </div>
                  {project.developerName ? (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {project.developerName}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <Button className="rounded-full" onClick={() => setOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Request brochure
                  </Button>
                  <Button variant="outline" className="rounded-full" onClick={() => setOpen(true)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enquire about this project
                  </Button>
                  {whatsappUrl ? (
                    <Button asChild variant="outline" className="rounded-full">
                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                        <MessageCircleMore className="mr-2 h-4 w-4" />
                        WhatsApp enquiry
                      </a>
                    </Button>
                  ) : null}
                  {project.brochureUrl ? (
                    <Button asChild variant="ghost" className="rounded-full">
                      <a href={project.brochureUrl} target="_blank" rel="noreferrer">
                        Open brochure
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="project_enquiry" projectId={project.projectId} title={project.name} />
    </>
  );
}
