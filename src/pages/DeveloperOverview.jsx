import React from "react";
import { Link } from "react-router-dom";
import SectionHeading from "@/components/common/SectionHeading";
import MetricCard from "@/components/common/MetricCard";
import QueueCard from "@/components/common/QueueCard";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useDeveloperPortalWorkspace from "@/hooks/useDeveloperPortalWorkspace";
import { buildDeveloperFinanceSummary } from "@/lib/developerLifecycle";
import { compactLabel, formatCurrency } from "@/lib/revenue";

export default function DeveloperOverview() {
  const { data: workspace } = useDeveloperPortalWorkspace();

  if (!workspace.organisation) {
    return (
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Developer portal"
          title="Portal setup required"
          description="This workspace activates after a live developer organisation membership has been assigned to your account."
        />
        <EmptyStateCard title="No developer organisation is linked yet" description="Ask the internal team to create a developer organisation membership for your user before using the portal." />
      </div>
    );
  }

  const finance = buildDeveloperFinanceSummary({
    organisationId: workspace.organisation.id,
    deals: workspace.deals,
    entitlements: workspace.entitlements,
    disputes: workspace.disputes,
  });
  const listingsNeedingAction = workspace.listings.filter((listing) => (
    ["stale", "flagged", "frozen", "rejected", "verification_pending", "under_review"].includes(listing.status)
    || ["suppressed", "frozen", "rejected"].includes(listing.publication_status)
  ));
  const pendingDocuments = workspace.documents.filter((item) => ["agreement_pdf", "reservation_form", "spa_document", "payment_evidence", "handover_doc"].includes(item.document_type));
  const unreadNotifications = workspace.notifications.filter((item) => item.status !== "read");
  const pendingListingRevisions = workspace.listingRevisions.filter((item) => ["submitted", "under_review"].includes(item.review_status));
  const pendingProjectRevisions = workspace.projectRevisions.filter((item) => ["submitted", "under_review"].includes(item.review_status));
  const latestAgreement = workspace.agreements[0] || null;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Developer portal"
        title={workspace.organisation.trading_name || workspace.organisation.legal_name}
        description="Manage projects, listings, deals, and shared documents without touching the public publishing layer directly."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Active projects" value={String(workspace.projects.filter((item) => item.status !== "completed").length)} />
        <MetricCard label="Active listings" value={String(workspace.listings.filter((item) => item.status !== "archived").length)} />
        <MetricCard label="Listings needing action" value={String(listingsNeedingAction.length)} />
        <MetricCard label="Active deals" value={String(workspace.deals.filter((item) => !["closed", "cancelled"].includes(item.stage)).length)} />
        <MetricCard label="Pending documents" value={String(pendingDocuments.length)} />
        <MetricCard label="Unread notifications" value={String(unreadNotifications.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <QueueCard
            title="Projects needing review"
            items={workspace.projects.slice(0, 5).map((project) => ({
              id: project.id,
              title: project.name,
              status: project.request_review_status || project.publication_status || project.status,
              meta: [
                compactLabel(project.status),
                project.handover_date ? `Handover ${project.handover_date}` : null,
                project.price_from ? formatCurrency(project.price_from) : null,
              ].filter(Boolean).join(" · "),
              href: "/developer/projects",
            }))}
            emptyMessage="No projects are linked to this developer yet."
          />
          <QueueCard
            title="Active deals"
            items={workspace.deals.slice(0, 5).map((deal) => ({
              id: deal.id,
              title: deal.deal_code || deal.buyer_name || "Developer deal",
              status: deal.stage,
              badges: [deal.reservation_status, deal.contract_status, deal.payment_status, deal.handover_status].filter(Boolean),
              meta: [deal.buyer_name, deal.listing_id, deal.project_id].filter(Boolean).join(" · "),
              amount: deal.sale_price,
              currency: "AED",
              href: "/developer/deals",
            }))}
            emptyMessage="No deals are linked yet."
            formatAmount={formatCurrency}
          />
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Workspace status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{compactLabel(workspace.organisation.status)}</Badge>
                <Badge variant="outline">Agreement {compactLabel(workspace.organisation.agreement_status || "not_sent")}</Badge>
                <Badge variant="outline">Portal {workspace.organisation.portal_enabled ? "enabled" : "disabled"}</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Primary contact: {workspace.organisation.primary_contact_name || "Not set"}</p>
                <p>Email: {workspace.organisation.primary_contact_email || "Not set"}</p>
                <p>Phone: {workspace.organisation.primary_contact_phone || "Not set"}</p>
                <p>Mandate: {workspace.organisation.mandate_scope || "Not set"}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Agreement handoff</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {latestAgreement ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{compactLabel(latestAgreement.agreement_status)}</Badge>
                    <Badge variant="outline">{compactLabel(latestAgreement.signature_status)}</Badge>
                    {latestAgreement.signature_provider ? <Badge variant="outline">{compactLabel(latestAgreement.signature_provider)}</Badge> : null}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Agreement: {latestAgreement.agreement_code || latestAgreement.agreement_type || "Developer agreement"}</p>
                    <p>Signer: {latestAgreement.counterparty_name || workspace.organisation.primary_contact_name || "Not set"}</p>
                    <p>Signer email: {latestAgreement.counterparty_email || workspace.organisation.primary_contact_email || "Not set"}</p>
                    <p>Last handoff: {latestAgreement.last_handoff_at ? new Date(latestAgreement.last_handoff_at).toLocaleString() : "Not recorded"}</p>
                  </div>
                  {latestAgreement.signature_request_url ? (
                    <a href={latestAgreement.signature_request_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                      Open signature request
                    </a>
                  ) : <p className="text-sm text-muted-foreground">The internal team has not shared a signature request link yet.</p>}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No agreement handoff is linked to this portal yet.</p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Commercial snapshot</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 p-4">
                <p className="text-sm text-muted-foreground">Pipeline sale value</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(finance.saleValue)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <p className="text-sm text-muted-foreground">Expected platform fee</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(finance.expectedPlatformFee)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <p className="text-sm text-muted-foreground">Expected commission</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(finance.expectedCommission)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 p-4">
                <p className="text-sm text-muted-foreground">Open disputes</p>
                <p className="mt-2 text-2xl font-semibold">{finance.openDisputes}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[2rem] border-white/10 bg-card/80">
            <CardHeader><CardTitle>Pending governance</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{pendingListingRevisions.length} listing revisions are awaiting internal review.</p>
              <p>{pendingProjectRevisions.length} project publication or update requests are live.</p>
              <p><Link to="/developer/listings" className="text-primary underline-offset-4 hover:underline">Open listings</Link> to draft new stock or submit live-update requests.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
