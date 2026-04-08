import React from "react";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compactLabel } from "@/lib/revenue";

export default function DeveloperInventoryTab({ inventory }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Orphan projects</p><p className="mt-3 text-3xl font-semibold">{inventory.orphanProjects.length}</p></CardContent></Card>
        <Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Orphan listings</p><p className="mt-3 text-3xl font-semibold">{inventory.orphanListings.length}</p></CardContent></Card>
        <Card className="rounded-[2rem] border-white/10 bg-card/80"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Listings without project</p><p className="mt-3 text-3xl font-semibold">{inventory.listingsWithoutProject.length}</p></CardContent></Card>
      </div>
      <Card className="rounded-[2rem] border-white/10 bg-card/80">
        <CardHeader><CardTitle>Inventory ownership map</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {inventory.tree.length ? inventory.tree.map((entry) => (
            <details key={entry.organisation.id} className="rounded-2xl border border-white/10 p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{entry.organisation.trading_name || entry.organisation.legal_name}</p>
                    <p className="text-sm text-muted-foreground">{entry.projects.length} projects · {entry.projects.reduce((total, projectEntry) => total + projectEntry.listings.length, 0)} linked listings</p>
                  </div>
                  <Badge variant="outline">{compactLabel(entry.organisation.status)}</Badge>
                </div>
              </summary>
              <div className="mt-4 space-y-4">
                {entry.projects.length ? entry.projects.map((projectEntry) => (
                  <div key={projectEntry.project.id} className="rounded-2xl border border-white/10 p-4">
                    <p className="font-medium">{projectEntry.project.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{compactLabel(projectEntry.project.status)} · {projectEntry.listings.length} listings</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {projectEntry.listings.length ? projectEntry.listings.map((listing) => (
                        <Badge key={listing.id} variant="outline">{listing.title}</Badge>
                      )) : <span className="text-sm text-muted-foreground">No listings linked.</span>}
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No projects linked yet.</p>}
                {entry.listingsWithoutProject.length ? (
                  <div className="rounded-2xl border border-dashed border-amber-300/60 bg-amber-50 p-4">
                    <p className="font-medium text-amber-900">Listings without project</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.listingsWithoutProject.map((listing) => <Badge key={listing.id} variant="outline">{listing.title}</Badge>)}
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
          )) : <EmptyStateCard title="No developer inventory yet" description="Projects and listings will appear here once linked to a signed developer." />}
        </CardContent>
      </Card>
    </div>
  );
}
