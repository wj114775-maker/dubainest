import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles } from "lucide-react";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";

export default function HeroSearch({ appName }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listingDirectoryPath = query.trim() ? `/properties?q=${encodeURIComponent(query.trim())}` : "/properties";

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(218,165,32,0.18),transparent_30%),linear-gradient(135deg,rgba(12,18,28,1),rgba(18,28,44,0.95))] p-6 text-white shadow-2xl shadow-black/20 md:p-10">
      <div className="max-w-3xl space-y-6">
        <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-white hover:bg-white/10">
          Dubai property purchase, off-plan, and private inventory
        </Badge>
        <div className="space-y-3">
          <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">{appName} brings Dubai property purchase into one clear buyer journey.</h2>
          <p className="max-w-2xl text-sm text-white/75 md:text-lg">Explore live opportunities, request curated options, and move from shortlist to purchase support when you are ready.</p>
        </div>
        <div className="flex flex-col gap-3 rounded-3xl bg-white/10 p-3 backdrop-blur md:flex-row">
          <Input placeholder="Search by area, project or intent" value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 rounded-2xl border-white/10 bg-white/10 text-white placeholder:text-white/50" />
          <Button asChild className="h-12 rounded-2xl bg-white text-slate-950 hover:bg-white/90">
            <Link to={listingDirectoryPath}>
              <Search className="mr-2 h-4 w-4" />
              Explore properties
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-white/70">
          <span className="rounded-full border border-white/10 px-3 py-1">Golden Visa workflow</span>
          <button type="button" onClick={() => setOpen(true)} className="rounded-full border border-white/10 px-3 py-1 text-left">HNW private inventory</button>
          <span className="rounded-full border border-white/10 px-3 py-1">WhatsApp-first concierge</span>
          <span className="rounded-full border border-white/10 px-3 py-1"><Sparkles className="mr-1 inline h-3 w-3" /> Developer-aligned purchase support</span>
        </div>
      </div>
      <BuyerIntentSheet open={open} onOpenChange={setOpen} intentType="request_private_inventory" title="Request private inventory access" />
    </section>
  );
}
