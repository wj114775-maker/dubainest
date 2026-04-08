import React from "react";
import { Link } from "react-router-dom";
import EmptyStateCard from "@/components/common/EmptyStateCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { compactLabel } from "@/lib/revenue";

function formatDateTime(value = "") {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function DeveloperRegistryTab({ organisations = [], projects = [], listings = [], deals = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Signed developer registry</CardTitle></CardHeader>
      <CardContent>
        {organisations.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Legal name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Agreement</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Listings</TableHead>
                <TableHead>Deals</TableHead>
                <TableHead>Portal</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Last activity</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organisations.map((organisation) => (
                <TableRow key={organisation.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{organisation.legal_name}</p>
                      <p className="text-xs text-muted-foreground">{organisation.trading_name || "No trading name"}</p>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{compactLabel(organisation.status)}</Badge></TableCell>
                  <TableCell>{organisation.agreement_type || "—"}</TableCell>
                  <TableCell>{projects.filter((project) => project.developer_organisation_id === organisation.id || project.developer_id === organisation.id).length}</TableCell>
                  <TableCell>{listings.filter((listing) => listing.developer_organisation_id === organisation.id || listing.developer_id === organisation.id).length}</TableCell>
                  <TableCell>{deals.filter((deal) => deal.developer_organisation_id === organisation.id).length}</TableCell>
                  <TableCell>{organisation.portal_enabled ? "Enabled" : "Disabled"}</TableCell>
                  <TableCell>{organisation.primary_contact_name || "—"}</TableCell>
                  <TableCell>{formatDateTime(organisation.last_activity_at)}</TableCell>
                  <TableCell><Button asChild variant="outline" size="sm"><Link to={`/ops/developers/${organisation.id}`}>Open</Link></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyStateCard title="No signed developers yet" description="Convert a prospect to create the first signed developer record." />
        )}
      </CardContent>
    </Card>
  );
}
