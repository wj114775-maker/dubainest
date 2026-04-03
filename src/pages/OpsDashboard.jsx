import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Gem,
  Landmark,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import AccessGuard from "@/components/admin/AccessGuard";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import QueueCard from "@/components/common/QueueCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listEntitySafe } from "@/lib/base44Safeguards";
import { compactLabel, formatCurrency, getEntitlementAmount, isOverdueDate } from "@/lib/revenue";

function WorkspacePortalCard({ title, badge, description, rules, path, actionLabel, icon: Icon }) {
  return (
    <Card className="h-full rounded-[2rem] border-white/10 bg-card/80 shadow-xl shadow-black/5">
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <Badge variant="outline">{badge}</Badge>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          {rules.map((rule) => (
            <p key={rule}>{rule}</p>
          ))}
        </div>
        <div className="mt-auto">
          <Button variant="outline" asChild>
            <Link to={path}>{actionLabel}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkflowStageCard({ step, title, description, count, helper, path, actionLabel, icon: Icon, accent }) {
  return (
    <Link to={path} className="group block">
      <Card className="relative h-full overflow-hidden rounded-[2rem] border-white/10 bg-card/85 shadow-xl shadow-black/5 transition hover:-translate-y-0.5 hover:shadow-2xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${accent}`} />
        <CardContent className="relative flex h-full flex-col gap-5 p-6">
          <div className="flex items-start justify-between gap-4">
            <Badge variant="outline" className="border-white/20 bg-background/50">
              {step}
            </Badge>
            <div className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] bg-background/70 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <div>
            <p className="text-4xl font-semibold tracking-tight">{count}</p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="mt-auto flex items-end justify-between gap-4">
            <p className="text-xs text-muted-foreground">{helper}</p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              {actionLabel}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function OpsDashboard() {
  const [showSystemMap, setShowSystemMap] = useState(false);
  const { data } = useQuery({
    queryKey: ["ops-dashboard-data"],
    queryFn: async () => {
      const [
        leads,
        assignments,
        complianceCases,
        listings,
        entitlements,
        invoices,
        disputes,
        conciergeCases,
        conciergeTasks
      ] = await Promise.all([
        base44.entities.Lead.list("-updated_date", 300),
        base44.entities.LeadAssignment.list("-updated_date", 300),
        base44.entities.ComplianceCase.list("-updated_date", 300),
        base44.entities.Listing.list("-updated_date", 300),
        listEntitySafe("RevenueEntitlement", "-updated_date", 300),
        listEntitySafe("InvoiceRecord", "-updated_date", 300),
        listEntitySafe("RevenueDispute", "-updated_date", 300),
        listEntitySafe("ConciergeCase", "-updated_date", 300),
        listEntitySafe("ConciergeTask", "-updated_date", 400)
      ]);

      return { leads, assignments, complianceCases, listings, entitlements, invoices, disputes, conciergeCases, conciergeTasks };
    },
    initialData: {
      leads: [],
      assignments: [],
      complianceCases: [],
      listings: [],
      entitlements: [],
      invoices: [],
      disputes: [],
      conciergeCases: [],
      conciergeTasks: []
    }
  });

  const workspace = useMemo(() => {
    const closedLeadStatuses = new Set(["lost", "merged", "blocked"]);
    const openConciergeStatuses = new Set([
      "new",
      "intake_in_progress",
      "qualification_complete",
      "nda_pending",
      "awaiting_documents",
      "ready_for_matching",
      "inventory_curation",
      "partner_matching",
      "viewing_planning",
      "active_service",
      "waiting_on_client",
      "waiting_on_partner",
      "deal_in_progress",
      "post_deal_services",
      "ready_for_closure"
    ]);
    const openRevenueStatuses = new Set(["draft", "pending_review", "approved", "invoiced", "awaiting_payment", "partially_paid", "disputed", "adjusted"]);
    const openDisputeStatuses = new Set(["open", "under_review", "partner_response", "escalated"]);
    const openComplianceStatuses = new Set(["open", "triage", "under_review", "awaiting_evidence"]);

    const assignmentByLead = new Map(data.assignments.map((item) => [item.lead_id, item]));
    const openLeads = data.leads.filter((lead) => !closedLeadStatuses.has(lead.status));
    const intakeLeads = openLeads.filter((lead) => {
      const stage = lead.current_stage || lead.status;
      return !stage || ["new", "intake", "qualification", "qualified", "contacted"].includes(stage) || ["new", "triage", "qualified", "contacted"].includes(lead.status);
    });
    const highTouchLeads = intakeLeads.filter((lead) => Boolean(lead.is_private_inventory || lead.is_high_value)).length;
    const unassignedLeads = openLeads.filter((lead) => {
      const assignment = assignmentByLead.get(lead.id);
      return !lead.assigned_partner_id && !assignment?.partner_id && !["won", "lost", "merged", "blocked"].includes(lead.status);
    });
    const protectedLeads = openLeads.filter((lead) => ["locked", "protected", "soft_owned"].includes(lead.ownership_status)).length;
    const verificationCases = data.complianceCases.filter((item) => openComplianceStatuses.has(item.status));
    const supplyIssues = data.listings.filter((item) => ["under_review", "verification_pending", "flagged", "frozen", "stale"].includes(item.status) || ["stale", "expired"].includes(item.freshness_status));
    const activeConciergeCases = data.conciergeCases.filter((item) => openConciergeStatuses.has(item.case_status));
    const urgentConciergeCases = activeConciergeCases.filter((item) => ["urgent", "vip"].includes(item.priority)).length;
    const overdueConciergeTasks = data.conciergeTasks.filter((item) => !["completed", "cancelled"].includes(item.status) && item.due_date && new Date(item.due_date) < new Date());
    const openEntitlements = data.entitlements.filter((item) => openRevenueStatuses.has(item.entitlement_status));
    const awaitingPaymentAmount = openEntitlements
      .filter((item) => ["approved", "invoiced", "awaiting_payment", "partially_paid", "disputed", "adjusted"].includes(item.entitlement_status))
      .reduce((sum, item) => sum + Math.max(0, Number(item.net_amount || item.gross_amount || 0) - Number(item.paid_amount || 0)), 0);
    const overdueInvoices = data.invoices.filter((item) => isOverdueDate(item.due_date) && !["paid", "void"].includes(item.invoice_status));
    const openDisputes = data.disputes.filter((item) => openDisputeStatuses.has(item.status) || !["resolved", "rejected", "closed"].includes(item.status));
    const closeoutCases = activeConciergeCases.filter((item) => item.case_status === "ready_for_closure").length;

    return {
      intakeLeads,
      highTouchLeads,
      unassignedLeads,
      protectedLeads,
      verificationCases,
      supplyIssues,
      activeConciergeCases,
      urgentConciergeCases,
      overdueConciergeTasks,
      openEntitlements,
      awaitingPaymentAmount,
      overdueInvoices,
      openDisputes,
      closeoutCases
    };
  }, [data]);

  const metrics = [
    {
      label: "New buyer work",
      value: String(workspace.intakeLeads.length),
      hint: `${workspace.highTouchLeads} private, high-value, or premium inquiries`
    },
    {
      label: "Needs assignment",
      value: String(workspace.unassignedLeads.length),
      hint: `${workspace.protectedLeads} protected leads already locked`
    },
    {
      label: "Supply blockers",
      value: String(workspace.supplyIssues.length + workspace.verificationCases.length),
      hint: `${workspace.verificationCases.length} verification cases are still open`
    },
    {
      label: "Premium cases live",
      value: String(workspace.activeConciergeCases.length),
      hint: `${workspace.urgentConciergeCases} urgent or VIP`
    },
    {
      label: "Awaiting payment",
      value: formatCurrency(workspace.awaitingPaymentAmount),
      hint: `${workspace.overdueInvoices.length} invoices are overdue`
    },
    {
      label: "Exceptions to close",
      value: String(workspace.openDisputes.length + workspace.overdueConciergeTasks.length),
      hint: `${workspace.openDisputes.length} disputes, ${workspace.overdueConciergeTasks.length} overdue concierge tasks`
    }
  ];

  const stageCards = [
    {
      step: "01",
      title: "Capture and qualify",
      description: "New demand enters the system here. Confirm intent, budget, urgency, and whether it is premium or private.",
      count: workspace.intakeLeads.length,
      helper: `${workspace.highTouchLeads} already look high-value or private.`,
      path: "/ops/leads",
      actionLabel: "Open buyer pipeline",
      icon: Briefcase,
      accent: "from-sky-500/20 via-primary/10 to-transparent"
    },
    {
      step: "02",
      title: "Protect and assign",
      description: "Lock ownership, remove ambiguity, and route the buyer to the correct partner or internal concierge owner.",
      count: workspace.unassignedLeads.length,
      helper: `${workspace.protectedLeads} open leads already have protection in place.`,
      path: "/ops/leads",
      actionLabel: "Review assignment state",
      icon: ShieldCheck,
      accent: "from-emerald-500/20 via-primary/10 to-transparent"
    },
    {
      step: "03",
      title: "Verify supply",
      description: "Only trusted stock should move forward. Resolve authority, permits, freshness, and publication readiness here.",
      count: workspace.supplyIssues.length + workspace.verificationCases.length,
      helper: `${workspace.supplyIssues.length} listings and ${workspace.verificationCases.length} issues need review.`,
      path: "/ops/listings",
      actionLabel: "Open supply review",
      icon: Building2,
      accent: "from-amber-500/20 via-primary/10 to-transparent"
    },
    {
      step: "04",
      title: "Run the client journey",
      description: "Handle private inventory, NDA, viewings, service referrals, and premium case execution in one controlled lane.",
      count: workspace.activeConciergeCases.length,
      helper: `${workspace.overdueConciergeTasks.length} concierge tasks are overdue right now.`,
      path: "/ops/concierge",
      actionLabel: "Open premium cases",
      icon: Gem,
      accent: "from-fuchsia-500/20 via-primary/10 to-transparent"
    },
    {
      step: "05",
      title: "Realise revenue",
      description: "Turn protected work into fee claims, invoices, payment tracking, disputes, and settlements.",
      count: workspace.openEntitlements.length,
      helper: `${formatCurrency(workspace.awaitingPaymentAmount)} is still open.`,
      path: "/ops/revenue",
      actionLabel: "Open money desk",
      icon: WalletCards,
      accent: "from-emerald-400/20 via-primary/10 to-transparent"
    },
    {
      step: "06",
      title: "Close and learn",
      description: "Resolve disputes, clear blockers, close premium journeys, and keep the audit trail clean for future review.",
      count: workspace.openDisputes.length + workspace.closeoutCases,
      helper: `${workspace.openDisputes.length} live disputes and ${workspace.closeoutCases} cases ready to close.`,
      path: "/ops/audit",
      actionLabel: "Review audit and exceptions",
      icon: ScrollText,
      accent: "from-slate-500/20 via-primary/10 to-transparent"
    }
  ];

  const priorityItems = [
    workspace.intakeLeads.length ? {
      id: "lead-intake",
      title: "New buyer pipeline work",
      meta: `${workspace.intakeLeads.length} inquiries are waiting for qualification or first action.`,
      status: "capture_and_qualify",
      href: "/ops/leads",
      badges: workspace.highTouchLeads ? [`${workspace.highTouchLeads} premium/private`] : []
    } : null,
    workspace.supplyIssues.length ? {
      id: "supply-review",
      title: "Listings need verification or publication review",
      meta: `${workspace.supplyIssues.length} listings are blocked by trust, freshness, or publication issues.`,
      status: "verify_supply",
      href: "/ops/listings",
      badges: workspace.verificationCases.length ? [`${workspace.verificationCases.length} open cases`] : []
    } : null,
    workspace.overdueConciergeTasks.length ? {
      id: "concierge-overdue",
      title: "Premium case tasks are overdue",
      meta: `${workspace.overdueConciergeTasks.length} concierge tasks have passed their due date.`,
      status: "client_delivery",
      href: "/ops/concierge",
      badges: workspace.urgentConciergeCases ? [`${workspace.urgentConciergeCases} urgent/VIP`] : []
    } : null,
    workspace.awaitingPaymentAmount ? {
      id: "money-open",
      title: "Revenue is awaiting payment",
      meta: `${formatCurrency(workspace.awaitingPaymentAmount)} is still open across approved or invoiced work.`,
      status: "money_desk",
      href: "/ops/revenue",
      badges: workspace.overdueInvoices.length ? [`${workspace.overdueInvoices.length} overdue invoices`] : []
    } : null,
    workspace.openDisputes.length ? {
      id: "disputes-open",
      title: "Commercial disputes need resolution",
      meta: `${workspace.openDisputes.length} disputes are still open and need an owner or next action.`,
      status: "close_and_learn",
      href: "/ops/revenue",
      badges: ["resolve or settle"]
    } : null
  ].filter(Boolean);

  const moneyQueue = data.entitlements
    .filter((item) => ["pending_review", "approved", "invoiced", "awaiting_payment", "partially_paid", "disputed"].includes(item.entitlement_status))
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.notes || item.trigger_type || item.id,
      meta: [item.partner_id, item.lead_id].filter(Boolean).join(" · "),
      status: item.entitlement_status,
      amount: getEntitlementAmount(item),
      currency: item.currency
    }));

  const portalCards = [
    {
      title: "Buyer and member experience",
      badge: "Client-facing",
      description: "This is where buyers browse, shortlist, compare, and request support. It is not the daily admin workspace.",
      rules: [
        "Use for public discovery and logged-in buyer actions.",
        "Do not manage staff operations here."
      ],
      path: "/",
      actionLabel: "Open buyer side",
      icon: Sparkles
    },
    {
      title: "Partner workspace",
      badge: "Agencies",
      description: "Partners handle assigned leads, their listings, their concierge coordination, payouts, and disputes.",
      rules: [
        "Use for partner execution only.",
        "Partners should not use internal operations or control pages."
      ],
      path: "/partner",
      actionLabel: "Open partner workspace",
      icon: Users
    },
    {
      title: "Operations workspace",
      badge: "Staff",
      description: "This is the daily hub for staff. Start here, then move into buyer pipeline, supply review, premium cases, or money desk.",
      rules: [
        "Use for day-to-day case handling and queue management.",
        "This is the correct home for ops, concierge, compliance, and finance staff."
      ],
      path: "/ops",
      actionLabel: "Stay in operations",
      icon: Briefcase
    },
    {
      title: "Control center",
      badge: "Admin only",
      description: "Rules, permissions, security, and setup live here. This is configuration, not daily casework.",
      rules: [
        "Only admins should spend real time here.",
        "Use for setup, governance, and access management."
      ],
      path: "/ops/admin",
      actionLabel: "Open control center",
      icon: Landmark
    }
  ];

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Operations workspace"
        title="One clear operating flow from inquiry to cash"
        description="Start here every day. This page now puts today's work first. The broader platform map stays secondary unless you need it."
        action={(
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link to="/ops/leads">Open buyer pipeline</Link></Button>
            <Button variant="outline" onClick={() => setShowSystemMap((current) => !current)}>
              {showSystemMap ? "Hide platform map" : "Show platform map"}
            </Button>
          </div>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} hint={metric.hint} />
        ))}
      </div>

      <div className="space-y-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs uppercase tracking-[0.26em] text-primary">Pipeline</p>
          <h3 className="text-2xl font-semibold tracking-tight">Operate the business in six stages</h3>
          <p className="text-sm text-muted-foreground">This is the simplest mental model for the platform. Each card below opens the actual workspace that owns that stage.</p>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {stageCards.map((stage) => (
            <WorkflowStageCard key={stage.step} {...stage} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <QueueCard
          title="Start here next"
          items={priorityItems}
          emptyMessage="The main queues are currently under control."
          actionLabel="Open"
          formatStatus={compactLabel}
        />
        <AccessGuard permission="revenue.read">
          <QueueCard
            title="Money desk live items"
            items={moneyQueue}
            linkBase="/ops/revenue"
            emptyMessage="No open entitlements are waiting on finance."
            formatStatus={compactLabel}
            formatAmount={formatCurrency}
          />
        </AccessGuard>
      </div>

      {showSystemMap ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {portalCards.map((item) => (
              <WorkspacePortalCard key={item.title} {...item} />
            ))}
          </div>

          <Card className="rounded-[2rem] border-white/10 bg-card/75 shadow-xl shadow-black/5">
            <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.26em] text-primary">Use this rule</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight">Staff do daily work in operations. Admins do setup in control.</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Operations staff</p>
                <p className="mt-2">Start in Home, then go to Buyers, Listings, Premium, or Money.</p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Partners</p>
                <p className="mt-2">Stay in the Partner workspace for assigned leads, listings, concierge coordination, payouts, and disputes.</p>
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Admins</p>
                <p className="mt-2">Use Control Center only for governance, permissions, and platform setup.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
