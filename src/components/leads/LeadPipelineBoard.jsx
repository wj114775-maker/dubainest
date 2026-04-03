import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Gem, ShieldCheck, Sparkles, WalletCards } from "lucide-react";
import { buyerPipelineStages, compactLabel } from "@/lib/buyerPipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stageDecor = {
  capture: {
    icon: Sparkles,
    gradient: "from-sky-500/18 via-cyan-400/8 to-transparent",
    chip: "bg-sky-500/10 text-sky-100 border-sky-400/20"
  },
  protect: {
    icon: ShieldCheck,
    gradient: "from-emerald-500/18 via-green-400/8 to-transparent",
    chip: "bg-emerald-500/10 text-emerald-100 border-emerald-400/20"
  },
  supply: {
    icon: Briefcase,
    gradient: "from-amber-500/18 via-orange-400/8 to-transparent",
    chip: "bg-amber-500/10 text-amber-100 border-amber-400/20"
  },
  journey: {
    icon: Gem,
    gradient: "from-rose-500/18 via-fuchsia-400/8 to-transparent",
    chip: "bg-rose-500/10 text-rose-100 border-rose-400/20"
  },
  money: {
    icon: WalletCards,
    gradient: "from-emerald-400/18 via-teal-400/8 to-transparent",
    chip: "bg-teal-500/10 text-teal-100 border-teal-400/20"
  },
  closed: {
    icon: ArrowRight,
    gradient: "from-slate-500/18 via-slate-300/5 to-transparent",
    chip: "bg-slate-500/10 text-slate-100 border-slate-400/20"
  }
};

function LeadPipelineCard({ item, onOpenCase = () => {} }) {
  const stageStyle = stageDecor[item.pipeline_stage];
  const StageIcon = stageStyle.icon;
  const topBadges = [
    item.lead.priority,
    item.lead.is_private_inventory ? "private inventory" : null,
    item.lead.is_high_value ? "high value" : null,
    item.lead.is_duplicate_candidate ? "duplicate" : null,
    item.assignment?.sla_status === "breached" ? "sla breached" : item.assignment?.sla_status === "at_risk" ? "sla at risk" : null
  ].filter(Boolean);

  const statusBadges = [
    item.lead.status ? `lead: ${compactLabel(item.lead.status)}` : null,
    item.lead.ownership_status ? `ownership: ${compactLabel(item.lead.ownership_status)}` : null,
    item.assignment?.assignment_status ? `handoff: ${compactLabel(item.assignment.assignment_status)}` : null,
    item.conciergeCase?.case_status ? `premium: ${compactLabel(item.conciergeCase.case_status)}` : null,
    item.latestRevenue?.entitlement_status ? `money: ${compactLabel(item.latestRevenue.entitlement_status)}` : null
  ].filter(Boolean);

  return (
    <Card className="relative overflow-hidden rounded-[1.8rem] border-white/10 bg-background/75 shadow-lg shadow-black/5">
      <div className={cn("absolute inset-0 bg-gradient-to-br", stageStyle.gradient)} />
      <CardContent className="relative space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{item.lead.lead_code || item.lead.id}</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight">{item.identityName}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.intentLabel}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-background/75 text-primary">
            <StageIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={cn("rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.16em]", stageStyle.chip)}>
            {item.stageLabel}
          </Badge>
          {topBadges.map((badge) => (
            <Badge key={`${item.id}-${badge}`} variant="outline" className="rounded-full border-white/15 bg-background/45 text-[11px]">
              {compactLabel(badge)}
            </Badge>
          ))}
        </div>

        <div className="rounded-[1.2rem] border border-white/10 bg-background/55 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Next action</p>
          <p className="mt-2 text-sm">{item.nextAction}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.1rem] border border-white/10 bg-background/45 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Owner</p>
            <p className="mt-1">{item.ownerLabel}</p>
          </div>
          <div className="rounded-[1.1rem] border border-white/10 bg-background/45 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Live signal</p>
            <p className="mt-1">{item.liveSignal}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {statusBadges.map((badge) => (
            <Badge key={`${item.id}-${badge}`} variant="outline" className="rounded-full border-white/15 bg-background/40 text-[11px]">
              {badge}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => onOpenCase(item.id)}>
            Quick desk
          </Button>
          <Button size="sm" asChild>
            <Link to={`/ops/leads/${item.id}`}>Open case</Link>
          </Button>
          {item.conciergeCase ? (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/ops/concierge/${item.conciergeCase.id}`}>Premium</Link>
            </Button>
          ) : null}
          {item.latestRevenue ? (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/ops/revenue/${item.latestRevenue.id}`}>Money</Link>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LeadPipelineBoard({ items = [], onOpenCase = () => {} }) {
  const grouped = useMemo(() => {
    return buyerPipelineStages.map((stage) => ({
      ...stage,
      items: items.filter((item) => item.pipeline_stage === stage.id)
    }));
  }, [items]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max gap-4">
        {grouped.map((stage) => {
          const stageStyle = stageDecor[stage.id];
          const StageIcon = stageStyle.icon;

          return (
            <div key={stage.id} className="w-[340px] shrink-0 space-y-3">
              <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-card/80 shadow-xl shadow-black/5">
                <div className={cn("h-2 w-full bg-gradient-to-r", stageStyle.gradient)} />
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-background/70 text-primary">
                        <StageIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle>{stage.label}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-full border-white/15 bg-background/55 px-3 py-1">
                      {stage.items.length}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>

              <div className="space-y-3">
                {stage.items.length ? stage.items.map((item) => <LeadPipelineCard key={item.id} item={item} onOpenCase={onOpenCase} />) : (
                  <Card className="rounded-[1.8rem] border-dashed border-white/10 bg-card/45">
                    <CardContent className="p-5 text-sm text-muted-foreground">
                      No buyer cases are sitting in this stage right now.
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
