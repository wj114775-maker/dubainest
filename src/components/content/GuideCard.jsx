import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GuideCard({ guide }) {
  return (
    <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <CardContent className="space-y-5 p-6">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-slate-950 text-white">
          <BookOpen className="h-5 w-5" />
        </div>
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">{guide.category}</p>
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">
            <Link to={`/guides/${guide.slug}`} className="transition hover:text-primary">
              {guide.title}
            </Link>
          </h3>
          <p className="line-clamp-3 text-sm leading-7 text-slate-600">{guide.excerpt}</p>
        </div>
        <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Inside this guide</p>
          <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-700">{guide.body}</p>
        </div>
        <Button asChild variant="outline" className="w-full rounded-full">
          <Link to={`/guides/${guide.slug}`}>
            Read guide
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
