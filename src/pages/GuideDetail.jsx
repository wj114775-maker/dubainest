import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { CalendarDays, ChevronLeft, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SectionHeading from "@/components/common/SectionHeading";
import GuideCard from "@/components/content/GuideCard";
import SeoMeta from "@/components/seo/SeoMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, truncateSeoDescription } from "@/lib/seo";

function formatGuideCategory(value) {
  return String(value || "guide").replace(/_/g, " ");
}

export default function GuideDetail() {
  const { slug } = useParams();
  const { data: guides = [] } = useQuery({
    queryKey: ["guide-detail", slug],
    queryFn: async () => {
      try {
        return await base44.entities.Guide.filter({ status: "published" }, "-updated_date", 200);
      } catch {
        return [];
      }
    },
    initialData: [],
  });

  const guide = guides.find((item) => item.slug === slug) || null;
  const relatedGuides = guides.filter((item) => item.slug !== slug).slice(0, 3);
  const description = truncateSeoDescription(
    guide?.excerpt
      || guide?.body
      || "Dubai property guidance for buyers, investors, and relocating families."
  );

  if (!guide) {
    return (
      <>
        <SeoMeta
          title="Guide Not Found"
          description="The requested guide page could not be found."
          canonicalPath={`/guides/${slug}`}
          robots="noindex,nofollow"
        />
        <div className="space-y-4 pb-28">
          <SectionHeading
            eyebrow="Guides"
            title="Guide not found"
            description="This guide is not published or is no longer available."
            titleAs="h1"
          />
          <Button asChild className="rounded-full px-5">
            <Link to="/guides">Back to guides</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoMeta
        title={guide.title}
        description={description}
        canonicalPath={`/guides/${guide.slug}`}
        type="article"
        jsonLd={[
          buildBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]),
          buildArticleJsonLd({
            headline: guide.title,
            description,
            path: `/guides/${guide.slug}`,
            datePublished: guide.created_date,
            dateModified: guide.updated_date || guide.created_date,
            section: formatGuideCategory(guide.category),
          }),
        ]}
      />

      <div className="space-y-6 pb-28">
        <Button asChild variant="outline" className="rounded-full px-5">
          <Link to="/guides">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to guides
          </Link>
        </Button>

        <SectionHeading
          eyebrow="Guide"
          title={guide.title}
          description={guide.excerpt || description}
          titleAs="h1"
        />

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
            <Tag className="h-4 w-4" />
            {formatGuideCategory(guide.category)}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2">
            <CalendarDays className="h-4 w-4" />
            Updated {new Date(guide.updated_date || guide.created_date).toLocaleDateString()}
          </span>
        </div>

        <Card className="rounded-[2rem] border-white/10 bg-card/90 shadow-xl shadow-black/5">
          <CardContent className="prose prose-slate max-w-none p-6 prose-headings:tracking-tight prose-p:leading-7 prose-a:text-primary">
            <ReactMarkdown>{guide.body || guide.excerpt || ""}</ReactMarkdown>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-white/10 bg-card/90 shadow-xl shadow-black/5">
          <CardContent className="space-y-4 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Next step</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              If this guide clarified the right purchase path, move into the property directory to search current opportunities, off-plan launches, and developer-led stock.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-5">
                <Link to="/properties">Search properties</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link to="/projects">Explore projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {relatedGuides.length ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Related guides</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {relatedGuides.map((item) => <GuideCard key={item.id} guide={item} />)}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
