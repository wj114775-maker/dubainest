import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function tone(status) {
  if (status === "published" || status === "verified") return "bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/10";
  if (status === "frozen" || status === "rejected" || status === "suppressed") return "bg-rose-600/10 text-rose-700 hover:bg-rose-600/10";
  if (status === "under_review" || status === "verification_pending" || status === "eligible") return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10";
  return "bg-slate-100 text-slate-600 hover:bg-slate-100";
}

function formatPrice(value) {
  return value ? `AED ${Number(value).toLocaleString()}` : "—";
}

export default function ListingRegistryTableCard({ listings, onEdit }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader>
        <CardTitle>Listings table</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Listing</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Publication</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <p className="font-medium text-foreground">{listing.title || listing.id}</p>
                  <p className="text-xs text-muted-foreground">{listing.property_type || "Property"}{listing.slug ? ` · ${listing.slug}` : ""}</p>
                </TableCell>
                <TableCell>{listing.listing_type || "sale"}</TableCell>
                <TableCell>{formatPrice(listing.price)}</TableCell>
                <TableCell>
                  <Badge className={tone(listing.status)}>{String(listing.status || "draft").replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={tone(listing.publication_status)}>{String(listing.publication_status || "draft").replace(/_/g, " ")}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(listing)}>Edit</Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/ops/listings/${listing.id}`}>Detail</Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
