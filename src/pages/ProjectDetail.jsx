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
import ListingCard from "@/components/buyer/ListingCard";
import ProjectSpotlightCard from "@/components/buyer/ProjectSpotlightCard";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import SeoMeta from "@/components/seo/SeoMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { loadBuyerListings } from "@/lib/buyerListings";
import { listDeveloperProfiles } from "@/lib/developerProfiles";
import { buildManagedProjectDirectory, getProjectProfileBySlug, hydrateProjectProfile, listProjectProfiles } from "@/lib/projectProfiles";
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
  const { data: projectProfiles = [] } = useQuery({
    queryKey: ["project-detail-project-profiles"],
    queryFn: () => listProjectProfiles(),
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

  const allProjects = useMemo(
    () => buildManagedProjectDirectory(projectProfiles, projects, listings, developerProfiles),
    [developerProfiles, listings, projectProfiles, projects]
  );
  const galleryImages = useMemo(
    () => project?.galleryImageUrls?.length ? project.galleryImageUrls : [project?.heroImageUrl].filter(Boolean),
    [project]
  );
  const relatedListings = project?.featuredListings || [];
  const relatedProjects = allProjects
    .filter((item) => item.slug !== slug && item.developerSlug && item.developerSlug === project?.developerSlug)
    .slice(0, 3);
  const areaListings = listings
    .filter((item) => item.project_name !== project?.name && item.area_name === project?.areaName)
    .slice(0, 3);
  const whatsappUrl = buildWhatsAppUrl(project?.contactPhone || appConfig.whatsapp_number, project || {});
  const projectSearchPath = project?.name ? `/properties?q=${encodeURIComponent(project.name)}` : "/properties";
  const areaSearchPath = project?.areaName ? `/properties?q=${encodeURIComponent(project.areaName)}` : "/properties";

  if (!project) {
    return (
      <>
        <SeoMeta
          title="Project Not Found"
          description="The requested project page could not be found."
          canonicalPath={`/projects/${slug}`}
          robots="noindex,nofollow"
        />
        <div className="pb-28 text-sm text-muted-foreground">This project page is not live yet.</div>
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
          ...(project.developerSlug ? [{ name: project.developerName, path: `/developers/${project.developerSlug}` }] : []),
          { name: "Projects", path: "/projects" },
          { name: project.name, path: `/projects/${slug}` },
        ])}
      />

      <div className="space-y-6 pb-28">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="space-y-5">
              <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_18rem]">
                  <div className="relative aspect-[16/11] bg-slate-100">
                    <img src={galleryImages[activeImageIndex] || project.heroImageUrl} alt={project.name} className="h-full w-full object-cover" />

                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <Badge className="rounded-full bg-slate-950 px-3.5 py-1.5 text-white hover:bg-slate-950">
                        {formatProjectStatus(project.status)}
                      </Badge>
                      {project.handoverLabel ? (
                        <Badge className="rounded-full border border-white/60 bg-white/90 px-3.5 py-1.5 text-slate-900 hover:bg-white">
                          Handover {project.handoverLabel}
                        </Badge>
                      ) : null}
                    </div>

                    {galleryImages.length > 1 ? (
                      <>
                        <button
                          type="button"
                          aria-label="Previous image"
                          className="absolute left-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
                          onClick={() => setActiveImageIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length)}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          aria-label="Next image"
                          className="absolute right-4 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur"
                          onClick={() => setActiveImageIndex((current) => (current + 1) % galleryImages.length)}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    ) : null}

                    <div className="absolute bottom-4 right-4 rounded-full bg-slate-950/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                      {galleryImages.length} image{galleryImages.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="hidden border-l border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 lg:flex lg:flex-col lg:justify-between">
                    <div className="space-y-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Launch summary</p>
                      <div>
                        <p className="text-3xl font-semibold tracking-tight text-slate-950">{formatPrice(project.priceFrom)}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {project.developerName ? `${project.developerName} in ` : ""}{project.areaName || "Dubai"}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <DetailRow label="Area" value={project.areaName || "Dubai"} />
                        <DetailRow
                          label="Developer"
                          value={project.developerName || "On request"}
                          action={project.developerSlug ? (
                            <Button asChild variant="ghost" size="sm" className="rounded-full px-3 text-slate-700">
                              <Link to={`/developers/${project.developerSlug}`}>Open</Link>
                            </Button>
                          ) : null}
                        />
                        <DetailRow label="Handover" value={project.handoverLabel || "TBC"} />
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">What this page does</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        It gives buyers the key project details first, then links them to the homes available in it.
                      </p>
                    </div>
                  </div>
                </div>

                {galleryImages.length > 1 ? (
                  <div className="grid gap-2 border-t border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-4 lg:grid-cols-5">
                    {galleryImages.slice(0, 5).map((image, index) => (
                      <button
                        type="button"
                        key={image}
                        onClick={() => setActiveImageIndex(index)}
                        className={`overflow-hidden rounded-[1rem] border ${activeImageIndex === index ? "border-slate-950" : "border-slate-200"}`}
                      >
                        <img src={image} alt={`${project.name} ${index + 1}`} className="h-20 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                    Project page
                  </Badge>
                  {project.developerName ? (
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                      {project.developerName}
                    </Badge>
                  ) : null}
                  {project.bedroomRange ? (
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                      Bedrooms {project.bedroomRange}
                    </Badge>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <p className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">{project.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    {project.areaName ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {project.areaName}
                      </span>
                    ) : null}
                    {project.developerSlug ? (
                      <Link to={`/developers/${project.developerSlug}`} className="inline-flex items-center gap-1.5 text-slate-950 transition hover:text-primary">
                        <Building2 className="h-4 w-4" />
                        {project.developerName}
                      </Link>
                    ) : null}
                    {project.handoverLabel ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-4 w-4" />
                        {project.handoverLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="max-w-4xl text-sm leading-7 text-slate-600">
                    {project.summary || "This page explains the project, the developer behind it, and the homes currently available to review."}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <FactTile icon={CalendarClock} label="Project status" value={formatProjectStatus(project.status)} />
                  <FactTile icon={Sparkles} label="Price from" value={formatPrice(project.priceFrom)} />
                  <FactTile icon={Layers3} label="Unit mix" value={project.unitTypes?.slice(0, 2).join(", ") || "Available"} />
                  <FactTile icon={MapPin} label="Area" value={project.areaName || "Dubai"} />
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6 lg:p-7">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Project story</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">About this project</h2>
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    {project.body || project.summary || "This section should explain the location, style of homes, and who the project is likely to suit."}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6 lg:p-7">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Project essentials</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Key details</h2>
                  </div>
                  <div className="space-y-1">
                    <DetailRow label="Price from" value={formatPrice(project.priceFrom)} />
                    <DetailRow label="Handover" value={project.handoverLabel || "TBC"} />
                    <DetailRow label="Bedroom range" value={project.bedroomRange || "Varied mix"} />
                    <DetailRow label="Developer" value={project.developerName || "On request"} />
                  </div>
                </CardContent>
              </Card>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Payment plan</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Payment plan</h2>
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    {project.paymentPlanSummary || "Request the brochure for live pricing structure, launch incentives, and staged payment-plan detail."}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Amenities and lifestyle</p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Project highlights</h2>
                  </div>
                  {project.amenityHighlights?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {project.amenityHighlights.map((item) => (
                        <Badge key={item} variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-7 text-slate-600">
                      Add a few clear amenities here so buyers can quickly understand the lifestyle on offer.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {relatedListings.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Available stock</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Homes currently shown for this project</h2>
                  </div>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={projectSearchPath}>Open project stock</Link>
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {relatedListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            ) : null}

            {relatedProjects.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">More by the same developer</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">More projects from the same developer</h2>
                  </div>
                  {project.developerSlug ? (
                    <Button asChild variant="outline" className="rounded-full px-5">
                      <Link to={`/developers/${project.developerSlug}`}>Open developer</Link>
                    </Button>
                  ) : null}
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {relatedProjects.map((item) => (
                    <ProjectSpotlightCard key={item.slug} project={item} />
                  ))}
                </div>
              </section>
            ) : null}

            {areaListings.length ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Continue in the same area</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Nearby purchase opportunities in {project.areaName || "Dubai"}</h2>
                  </div>
                  <Button asChild variant="outline" className="rounded-full px-5">
                    <Link to={areaSearchPath}>Explore the area</Link>
                  </Button>
                </div>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {areaListings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
              <CardContent className="space-y-5 p-6">
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Project summary</p>
                  <p className="text-3xl font-semibold tracking-tight text-slate-950">{formatPrice(project.priceFrom)}</p>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p className="font-medium text-slate-950">{project.name}</p>
                    <p>{project.developerName ? `${project.developerName} · ` : ""}{project.areaName || "Dubai"}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-[1.4rem] border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Handover {project.handoverLabel || "TBC"}
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

                <div className="grid gap-2.5">
                  <Button className="h-11 rounded-full" onClick={() => setOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Request brochure
                  </Button>
                  <Button variant="outline" className="h-11 rounded-full" onClick={() => setOpen(true)}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Enquire about this project
                  </Button>
                  {whatsappUrl ? (
                    <Button asChild variant="outline" className="h-11 rounded-full">
                      <a href={whatsappUrl} target="_blank" rel="noreferrer">
                        <MessageCircleMore className="mr-2 h-4 w-4" />
                        WhatsApp enquiry
                      </a>
                    </Button>
                  ) : null}
                  {project.brochureUrl ? (
                    <Button asChild variant="ghost" className="h-11 rounded-full">
                      <a href={project.brochureUrl} target="_blank" rel="noreferrer">
                        Open brochure
                        <ArrowUpRight className="ml-2 h-4 w-4" />
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
                    {project.developerSlug ? (
                      <Button asChild variant="outline" className="justify-between rounded-full px-4">
                        <Link to={`/developers/${project.developerSlug}`}>
                          Developer page
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" className="justify-between rounded-full px-4">
                      <Link to={projectSearchPath}>
                        Project stock
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
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
        intentType="project_enquiry"
        projectId={project.projectId}
        title={project.name}
      />
    </>
  );
}
