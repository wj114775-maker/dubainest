import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Building2, CalendarClock, Sparkles } from "lucide-react";
import SectionHeading from "@/components/common/SectionHeading";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildBreadcrumbJsonLd } from "@/lib/seo";

const pillars = [
  {
    title: "Project-led discovery",
    description: "Start with the governed project pages when launch context, handover timing, and developer positioning matter more than a single listing.",
    icon: Building2,
  },
  {
    title: "Off-plan inventory routes",
    description: "Move into filtered off-plan stock only when you want to compare current opportunities inside the wider launch and project context.",
    icon: Sparkles,
  },
  {
    title: "Purchase timing clarity",
    description: "Use this route for buyers who care about delivery windows, staged buying decisions, and launch-phase selection support.",
    icon: CalendarClock,
  },
];

export default function OffPlan() {
  return (
    <div className="space-y-6 pb-28">
      <SeoMeta
        title="Off-Plan Property in Dubai"
        description="Explore Dubai off-plan opportunities through project pages, developer context, and launch-focused property discovery."
        canonicalPath="/off-plan"
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Off-Plan", path: "/off-plan" },
        ])}
      />

      <SectionHeading
        eyebrow="Off-plan"
        title="Explore Dubai off-plan property through dedicated project routes"
        description="This page acts as the public off-plan entry point so search engines and buyers both land on a proper page, not a filter URL."
        titleAs="h1"
        action={(
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="rounded-full px-5">
              <Link to="/projects">View project pages</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-5">
              <Link to="/properties?completion=off_plan">Open off-plan listings</Link>
            </Button>
          </div>
        )}
      />

      <div className="grid gap-5 md:grid-cols-3">
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
              <CardContent className="space-y-4 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-slate-950 text-white">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Use project pages first for the cleaner off-plan journey</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              The strongest buyer flow is developer, then project, then listing. This route keeps that structure intact while still letting you drill into current off-plan stock when needed.
            </p>
          </div>
          <Button asChild className="rounded-full px-5">
            <Link to="/projects">
              Open Dubai projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
