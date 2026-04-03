import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Filter, RotateCcw } from "lucide-react";
import SectionHeading from "@/components/common/SectionHeading";
import ListingListRow from "@/components/buyer/ListingListRow";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isShowcaseListing, loadBuyerListings } from "@/lib/buyerListings";

const defaultFilters = {
  query: "",
  listingType: "all",
  propertyType: "all",
  minBedrooms: "any",
  trust: "all",
  privateOnly: "all",
};

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openIntent, setOpenIntent] = useState(false);
  const initialQuery = searchParams.get("q") || "";
  const [filters, setFilters] = useState({ ...defaultFilters, query: initialQuery });

  const { data: listings = [] } = useQuery({
    queryKey: ["buyer-properties"],
    queryFn: () => loadBuyerListings({ limit: 18, includeShowcase: true }),
    initialData: [],
  });

  const propertyTypes = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.property_type).filter(Boolean))).sort(),
    [listings]
  );

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const query = filters.query.trim().toLowerCase();
      const matchesQuery =
        !query ||
        [listing.title, listing.area_name, listing.property_type, listing.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      const matchesListingType =
        filters.listingType === "all" ||
        (filters.listingType === "private_inventory"
          ? listing.is_private_inventory || listing.listing_type === "private_inventory"
          : listing.listing_type === filters.listingType);

      const matchesPropertyType =
        filters.propertyType === "all" || listing.property_type === filters.propertyType;

      const matchesBedrooms =
        filters.minBedrooms === "any" || Number(listing.bedrooms || 0) >= Number(filters.minBedrooms);

      const matchesTrust =
        filters.trust === "all" ||
        (filters.trust === "verified" ? Number(listing.trust_score || 0) >= 90 : Number(listing.trust_score || 0) >= 80);

      const matchesPrivate =
        filters.privateOnly === "all" ||
        (filters.privateOnly === "private"
          ? listing.is_private_inventory
          : !listing.is_private_inventory);

      return matchesQuery && matchesListingType && matchesPropertyType && matchesBedrooms && matchesTrust && matchesPrivate;
    });
  }, [filters, listings]);

  const liveCount = listings.filter((listing) => !isShowcaseListing(listing)).length;
  const showcaseCount = listings.length - liveCount;
  const showingShowcaseOnly = listings.length > 0 && liveCount === 0;

  const resetFilters = () => {
    setFilters(defaultFilters);
    setSearchParams({}, { replace: true });
  };

  const updateQuery = (value) => {
    setFilters((current) => ({ ...current, query: value }));
    if (value.trim()) {
      setSearchParams({ q: value.trim() }, { replace: true });
      return;
    }
    setSearchParams({}, { replace: true });
  };

  return (
    <>
      <div className="space-y-8 pb-28">
        <SectionHeading
          eyebrow="Property directory"
          title="A clearer, list-first property browse experience"
          description="Designed to feel more like a real property application: filters on the left, absorptive list rows on the right, and trust signals visible before the click."
          action={<Button className="rounded-full px-5" onClick={() => setOpenIntent(true)}>Speak to an adviser</Button>}
        />

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <Card className="h-fit rounded-[2rem] border-white/10 bg-card/90 xl:sticky xl:top-28">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Refine listings</p>
                  <p className="text-sm text-muted-foreground">Keep everything on one page.</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Filter className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Search</p>
                <Input
                  value={filters.query}
                  onChange={(event) => updateQuery(event.target.value)}
                  placeholder="Area, property type, or keyword"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Transaction</p>
                <Select value={filters.listingType} onValueChange={(value) => setFilters((current) => ({ ...current, listingType: value }))}>
                  <SelectTrigger><SelectValue placeholder="Any transaction" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any transaction</SelectItem>
                    <SelectItem value="sale">For sale</SelectItem>
                    <SelectItem value="private_inventory">Private inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Property type</p>
                <Select value={filters.propertyType} onValueChange={(value) => setFilters((current) => ({ ...current, propertyType: value }))}>
                  <SelectTrigger><SelectValue placeholder="Any property type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any property type</SelectItem>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Bedrooms</p>
                <Select value={filters.minBedrooms} onValueChange={(value) => setFilters((current) => ({ ...current, minBedrooms: value }))}>
                  <SelectTrigger><SelectValue placeholder="Any size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any size</SelectItem>
                    <SelectItem value="1">1+ bedrooms</SelectItem>
                    <SelectItem value="2">2+ bedrooms</SelectItem>
                    <SelectItem value="3">3+ bedrooms</SelectItem>
                    <SelectItem value="4">4+ bedrooms</SelectItem>
                    <SelectItem value="5">5+ bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Trust level</p>
                <Select value={filters.trust} onValueChange={(value) => setFilters((current) => ({ ...current, trust: value }))}>
                  <SelectTrigger><SelectValue placeholder="Any trust level" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any trust level</SelectItem>
                    <SelectItem value="strong">Strong trust 80+</SelectItem>
                    <SelectItem value="verified">Verified trust 90+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Inventory mode</p>
                <Select value={filters.privateOnly} onValueChange={(value) => setFilters((current) => ({ ...current, privateOnly: value }))}>
                  <SelectTrigger><SelectValue placeholder="All inventory" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All inventory</SelectItem>
                    <SelectItem value="private">Private inventory only</SelectItem>
                    <SelectItem value="public">Published only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="w-full rounded-full" onClick={resetFilters}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-[2rem] border-white/10 bg-card/90">
              <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {filteredListings.length} properties available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {liveCount} live listings
                    {showcaseCount ? ` and ${showcaseCount} showcase entries` : ""}
                    {" "}currently visible.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full">List view</Badge>
                  <Badge variant="outline" className="rounded-full">Trust-first</Badge>
                  <Badge variant="outline" className="rounded-full">Enterprise-style absorption</Badge>
                </div>
              </CardContent>
            </Card>

            {showingShowcaseOnly ? (
              <Card className="rounded-[2rem] border-primary/20 bg-primary/5">
                <CardContent className="space-y-2 p-6">
                  <p className="text-sm font-semibold text-foreground">Live partner stock is still being populated.</p>
                  <p className="text-sm text-muted-foreground">
                    The listings below are showcase examples with real imagery so the product stays usable and presentable while live inventory is being published.
                  </p>
                </CardContent>
              </Card>
            ) : null}

            {filteredListings.length ? (
              <div className="space-y-5">
                {filteredListings.map((listing) => (
                  <ListingListRow key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <Card className="rounded-[2rem] border-white/10 bg-card/90">
                <CardContent className="space-y-3 p-8">
                  <p className="text-lg font-semibold text-foreground">No properties match those filters.</p>
                  <p className="text-sm text-muted-foreground">
                    Broaden the search or ask the advisory team to curate options for you.
                  </p>
                  <div className="flex gap-3">
                    <Button variant="outline" className="rounded-full" onClick={resetFilters}>Reset filters</Button>
                    <Button className="rounded-full" onClick={() => setOpenIntent(true)}>Request curated options</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <BuyerIntentSheet
        open={openIntent}
        onOpenChange={setOpenIntent}
        intentType="request_callback"
        title="Request a curated property shortlist"
      />
    </>
  );
}
