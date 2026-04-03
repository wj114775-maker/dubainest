import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ChevronDown, List, Map, SlidersHorizontal } from "lucide-react";
import { createSearchParams, Link, useSearchParams } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ListingListRow from "@/components/buyer/ListingListRow";
import PropertyFilterPanel from "@/components/buyer/PropertyFilterPanel";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import SectionHeading from "@/components/common/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import useAppConfig from "@/hooks/useAppConfig";
import { getShowcaseListings, isShowcaseListing, loadBuyerListings } from "@/lib/buyerListings";
import { cn } from "@/lib/utils";

const defaultFilters = {
  location: "",
  completionStatus: "all",
  propertyType: "all",
  bedrooms: "any",
  bathrooms: "any",
  minPrice: "0",
  maxPrice: "0",
  minArea: "0",
  maxArea: "0",
  parkingSpaces: "any",
  furnishingStatus: "all",
  keywords: "",
  withFloorPlans: false,
  privateInventoryOnly: false,
  trustedOnly: false,
  showcaseOnly: false,
  sortBy: "popular",
};

const getViewModeFromSearchParams = (searchParams) => searchParams.get("map_active") === "true" ? "map" : "list";

const filtersFromSearchParams = (searchParams) => ({
  ...defaultFilters,
  location: searchParams.get("q") || "",
  completionStatus: searchParams.get("completion") || "all",
  propertyType: searchParams.get("propertyType") || "all",
  bedrooms: searchParams.get("beds") || "any",
  bathrooms: searchParams.get("baths") || "any",
  minPrice: searchParams.get("minPrice") || "0",
  maxPrice: searchParams.get("maxPrice") || "0",
  minArea: searchParams.get("minArea") || "0",
  maxArea: searchParams.get("maxArea") || "0",
  parkingSpaces: searchParams.get("parkingSpaces") || "any",
  furnishingStatus: searchParams.get("furnishing") || "all",
  keywords: searchParams.get("keywords") || "",
  withFloorPlans: searchParams.get("floorPlans") === "1",
  privateInventoryOnly: searchParams.get("privateInventory") === "1",
  trustedOnly: searchParams.get("trustedOnly") === "1",
  showcaseOnly: searchParams.get("showcaseOnly") === "1",
  sortBy: searchParams.get("sort") || "popular",
});

const buildSearchParams = (filters) => {
  const params = {};

  if (filters.location.trim()) params.q = filters.location.trim();
  if (filters.completionStatus !== "all") params.completion = filters.completionStatus;
  if (filters.propertyType !== "all") params.propertyType = filters.propertyType;
  if (filters.bedrooms !== "any") params.beds = filters.bedrooms;
  if (filters.bathrooms !== "any") params.baths = filters.bathrooms;
  if (filters.minPrice !== "0") params.minPrice = filters.minPrice;
  if (filters.maxPrice !== "0") params.maxPrice = filters.maxPrice;
  if (filters.minArea !== "0") params.minArea = filters.minArea;
  if (filters.maxArea !== "0") params.maxArea = filters.maxArea;
  if (filters.parkingSpaces !== "any") params.parkingSpaces = filters.parkingSpaces;
  if (filters.furnishingStatus !== "all") params.furnishing = filters.furnishingStatus;
  if (filters.keywords.trim()) params.keywords = filters.keywords.trim();
  if (filters.withFloorPlans) params.floorPlans = "1";
  if (filters.privateInventoryOnly) params.privateInventory = "1";
  if (filters.trustedOnly) params.trustedOnly = "1";
  if (filters.showcaseOnly) params.showcaseOnly = "1";
  if (filters.sortBy !== "popular") params.sort = filters.sortBy;

  return createSearchParams(params);
};

const formatMoneyShort = (value) => {
  const number = Number(value || 0);
  if (!number) return "Any";
  if (number >= 1000000) return `AED ${(number / 1000000).toFixed(number % 1000000 === 0 ? 0 : 1)}M`;
  return `AED ${number.toLocaleString()}`;
};

const formatAreaShort = (value) => {
  const number = Number(value || 0);
  if (!number) return "Any";
  return `${number.toLocaleString()} sqft`;
};

const filterSummaryChips = (filters, viewMode) => {
  const chips = ["Buy", viewMode === "map" ? "Map view" : "List view"];

  if (filters.location.trim()) chips.push(filters.location.trim());
  if (filters.completionStatus === "off_plan") chips.push("Off-Plan");
  if (filters.completionStatus === "ready") chips.push("Ready");
  if (filters.propertyType !== "all") chips.push(filters.propertyType);
  if (filters.bedrooms !== "any") chips.push(`${filters.bedrooms}+ beds`);
  if (filters.bathrooms !== "any") chips.push(`${filters.bathrooms}+ baths`);
  if (filters.minPrice !== "0" || filters.maxPrice !== "0") chips.push(`${formatMoneyShort(filters.minPrice)} - ${formatMoneyShort(filters.maxPrice)}`);
  if (filters.minArea !== "0" || filters.maxArea !== "0") chips.push(`${formatAreaShort(filters.minArea)} - ${formatAreaShort(filters.maxArea)}`);
  if (filters.keywords.trim()) chips.push(`Keyword: ${filters.keywords.trim()}`);
  if (filters.privateInventoryOnly) chips.push("Private Inventory");
  if (filters.withFloorPlans) chips.push("Floor plans");
  if (filters.trustedOnly) chips.push("Trusted only");

  return chips;
};

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: appConfig } = useAppConfig();
  const [openIntent, setOpenIntent] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [locationsExpanded, setLocationsExpanded] = useState(false);
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams));
  const [viewMode, setViewMode] = useState(() => getViewModeFromSearchParams(searchParams));

  const { data: listings = [] } = useQuery({
    queryKey: ["buyer-properties-v2"],
    queryFn: () => loadBuyerListings({ limit: 24, includeShowcase: true }),
    initialData: getShowcaseListings(24),
  });

  useEffect(() => {
    const nextFilters = filtersFromSearchParams(searchParams);
    const nextViewMode = getViewModeFromSearchParams(searchParams);

    if (JSON.stringify(nextFilters) !== JSON.stringify(filters)) {
      setFilters(nextFilters);
    }

    if (nextViewMode !== viewMode) {
      setViewMode(nextViewMode);
    }
  }, [searchParams]);

  useEffect(() => {
    const nextParams = buildSearchParams(filters);
    if (viewMode === "map") {
      nextParams.set("map_active", "true");
    }

    const nextString = nextParams.toString();
    const currentString = searchParams.toString();
    if (nextString !== currentString) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, viewMode]);

  const propertyTypes = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.property_type).filter(Boolean))).sort(),
    [listings]
  );

  const featuredListings = useMemo(
    () => [...listings]
      .sort((left, right) => {
        const leftScore = Number(Boolean(left.is_private_inventory)) * 20 + Number(Boolean(left.is_off_plan)) * 10 + Number(left.trust_score || 0);
        const rightScore = Number(Boolean(right.is_private_inventory)) * 20 + Number(Boolean(right.is_off_plan)) * 10 + Number(right.trust_score || 0);
        return rightScore - leftScore;
      })
      .slice(0, 4),
    [listings]
  );

  const areaOptions = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.area_name).filter(Boolean))).sort(),
    [listings]
  );

  const locationCounts = useMemo(() => {
    const counts = listings.reduce((accumulator, listing) => {
      const key = listing.area_name || "Dubai";
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    return Object.entries(counts)
      .sort((left, right) => right[1] - left[1])
      .map(([name, count]) => ({ name, count }));
  }, [listings]);

  const filteredListings = useMemo(() => {
    const searchTerm = filters.location.trim().toLowerCase();
    const keywordTerm = filters.keywords.trim().toLowerCase();

    const results = listings.filter((listing) => {
      const searchableText = [
        listing.title,
        listing.area_name,
        listing.description,
        listing.property_type,
        listing.developer_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesLocation = !searchTerm || searchableText.includes(searchTerm);
      const matchesKeywords = !keywordTerm || searchableText.includes(keywordTerm);
      const matchesCompletion = filters.completionStatus === "all" || listing.completion_status === filters.completionStatus;
      const matchesPropertyType = filters.propertyType === "all" || listing.property_type === filters.propertyType;
      const matchesBedrooms = filters.bedrooms === "any" || Number(listing.bedrooms || 0) >= Number(filters.bedrooms);
      const matchesBathrooms = filters.bathrooms === "any" || Number(listing.bathrooms || 0) >= Number(filters.bathrooms);
      const matchesMinPrice = filters.minPrice === "0" || Number(listing.price || 0) >= Number(filters.minPrice);
      const matchesMaxPrice = filters.maxPrice === "0" || Number(listing.price || 0) <= Number(filters.maxPrice);
      const matchesMinArea = filters.minArea === "0" || Number(listing.built_up_area_sqft || 0) >= Number(filters.minArea);
      const matchesMaxArea = filters.maxArea === "0" || Number(listing.built_up_area_sqft || 0) <= Number(filters.maxArea);
      const matchesParking = filters.parkingSpaces === "any" || Number(listing.parking_spaces || 0) >= Number(filters.parkingSpaces);
      const matchesFurnishing = filters.furnishingStatus === "all" || listing.furnishing_status === filters.furnishingStatus;
      const matchesFloorPlans = !filters.withFloorPlans || Boolean(listing.floor_plan_available);
      const matchesPrivateInventory = !filters.privateInventoryOnly || Boolean(listing.is_private_inventory);
      const matchesTrusted = !filters.trustedOnly || Number(listing.trust_score || 0) >= 85;
      const matchesShowcase = !filters.showcaseOnly || Boolean(isShowcaseListing(listing));

      return matchesLocation
        && matchesKeywords
        && matchesCompletion
        && matchesPropertyType
        && matchesBedrooms
        && matchesBathrooms
        && matchesMinPrice
        && matchesMaxPrice
        && matchesMinArea
        && matchesMaxArea
        && matchesParking
        && matchesFurnishing
        && matchesFloorPlans
        && matchesPrivateInventory
        && matchesTrusted
        && matchesShowcase;
    });

    return [...results].sort((left, right) => {
      switch (filters.sortBy) {
        case "price_low_high":
          return Number(left.price || 0) - Number(right.price || 0) || String(left.title || "").localeCompare(String(right.title || ""));
        case "price_high_low":
          return Number(right.price || 0) - Number(left.price || 0) || String(left.title || "").localeCompare(String(right.title || ""));
        case "size_large_small":
          return Number(right.built_up_area_sqft || 0) - Number(left.built_up_area_sqft || 0) || Number(right.price || 0) - Number(left.price || 0);
        case "off_plan_first":
          return Number(Boolean(right.is_off_plan)) - Number(Boolean(left.is_off_plan)) || Number(right.price || 0) - Number(left.price || 0);
        case "popular":
        default:
          return Number(right.trust_score || 0) - Number(left.trust_score || 0) || Number(right.price || 0) - Number(left.price || 0);
      }
    });
  }, [filters, listings]);

  const offPlanCount = filteredListings.filter((listing) => listing.is_off_plan).length;
  const privateInventoryCount = filteredListings.filter((listing) => listing.is_private_inventory).length;
  const readyCount = filteredListings.filter((listing) => !listing.is_off_plan).length;
  const chips = useMemo(() => filterSummaryChips(filters, viewMode), [filters, viewMode]);
  const mapFocusLabel = filters.location.trim() || filteredListings[0]?.area_name || "Dubai";
  const mapQuery = `${mapFocusLabel}, Dubai, UAE`;

  const resetFilters = () => {
    setFilters(defaultFilters);
    setAdvancedOpen(false);
  };

  const viewToggle = (
    <div className="inline-flex rounded-full border border-white/10 bg-background/70 p-1">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
          viewMode === "list" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setViewMode("list")}
      >
        <List className="h-4 w-4" />
        List
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
          viewMode === "map" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => setViewMode("map")}
      >
        <Map className="h-4 w-4" />
        Map
      </button>
    </div>
  );

  return (
    <>
      <div className="space-y-6 pb-28">
        <SectionHeading
          eyebrow="Property purchase"
          title="Properties for sale in Dubai"
          description="Browse apartments, villas, penthouses, and off-plan opportunities with a clean list view, a market map toggle, and buyer-first filters."
          action={<Button className="rounded-full px-5" onClick={() => setOpenIntent(true)}>Request curated shortlist</Button>}
        />

        <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
          <CardContent className="space-y-4 p-5 md:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Popular Dubai areas</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">Start with the market that best fits your search</p>
              </div>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setFilters((current) => ({ ...current, completionStatus: "off_plan", sortBy: "off_plan_first" }))}
              >
                View off-plan collection
              </Button>
            </div>

            <Collapsible open={locationsExpanded} onOpenChange={setLocationsExpanded}>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(locationsExpanded ? locationCounts : locationCounts.slice(0, 6)).map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, location: item.name }))}
                    className={cn(
                      "flex items-center justify-between rounded-[1.3rem] border px-4 py-4 text-left transition",
                      filters.location === item.name
                        ? "border-primary/25 bg-primary/10"
                        : "border-white/10 bg-background/60 hover:border-primary/20 hover:bg-background"
                    )}
                  >
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-sm text-muted-foreground">({item.count})</span>
                  </button>
                ))}
              </div>

              <CollapsibleContent className="pt-3" />

              {locationCounts.length > 6 ? (
                <CollapsibleTrigger asChild>
                  <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                    {locationsExpanded ? "Show fewer locations" : "View all locations"}
                    <ChevronDown className={cn("h-4 w-4 transition", locationsExpanded ? "rotate-180" : "")} />
                  </button>
                </CollapsibleTrigger>
              ) : null}
            </Collapsible>
          </CardContent>
        </Card>

        <div className="space-y-4 xl:hidden">
          <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{filteredListings.length} properties</p>
                  <p className="text-sm text-muted-foreground">{offPlanCount} off-plan · {privateInventoryCount} private inventory · {readyCount} ready</p>
                </div>
                <Button variant="outline" className="rounded-full" onClick={() => setMobileFiltersOpen(true)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {viewToggle}
                <div className="w-full sm:w-[220px]">
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}>
                    <SelectTrigger className="rounded-full">
                      <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Featured</SelectItem>
                      <SelectItem value="price_low_high">Price: low to high</SelectItem>
                      <SelectItem value="price_high_low">Price: high to low</SelectItem>
                      <SelectItem value="size_large_small">Largest size</SelectItem>
                      <SelectItem value="off_plan_first">Off-Plan first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {chips.map((chip) => <Badge key={chip} variant="outline" className="rounded-full">{chip}</Badge>)}
              </div>
            </CardContent>
          </Card>
        </div>

        {featuredListings.length ? (
          <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Featured properties</p>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">A quick read across apartments, villas, private inventory, and off-plan stock</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setFilters((current) => ({ ...current, completionStatus: "all", location: "", sortBy: "popular" }))}
                >
                  View featured selection
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {featuredListings.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/listing/${listing.id}`}
                    className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-background/70 text-left transition hover:border-primary/25 hover:bg-background"
                  >
                    <img src={listing.hero_image_url} alt={listing.title} className="h-40 w-full object-cover" />
                    <div className="space-y-2 p-4">
                      <div className="flex flex-wrap gap-2">
                        {listing.is_off_plan ? (
                          <Badge className="bg-sky-950 text-white hover:bg-sky-950">Off-Plan</Badge>
                        ) : (
                          <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">Ready</Badge>
                        )}
                        <Badge variant="outline" className="rounded-full">{listing.property_type || "Property"}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">{listing.area_name}</p>
                      <p className="text-sm font-medium text-foreground">AED {Number(listing.price || 0).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className={cn("grid gap-6", viewMode === "map" ? "xl:grid-cols-[320px,minmax(0,1fr),380px]" : "xl:grid-cols-[320px,1fr]")}>
          <div className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
            <PropertyFilterPanel
              filters={filters}
              setFilters={setFilters}
              propertyTypes={propertyTypes}
              areaOptions={areaOptions}
              advancedOpen={advancedOpen}
              setAdvancedOpen={setAdvancedOpen}
              onReset={resetFilters}
            />
          </div>

          <div className="space-y-4">
            <Card className="hidden rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5 xl:block">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{filteredListings.length} properties for sale</p>
                    <p className="text-sm text-muted-foreground">
                      {offPlanCount} off-plan · {privateInventoryCount} private inventory · {readyCount} ready to move
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {viewToggle}
                    <div className="w-full lg:w-[240px]">
                      <Select value={filters.sortBy} onValueChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}>
                        <SelectTrigger className="rounded-full">
                          <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="popular">Featured</SelectItem>
                          <SelectItem value="price_low_high">Price: low to high</SelectItem>
                          <SelectItem value="price_high_low">Price: high to low</SelectItem>
                          <SelectItem value="size_large_small">Largest size</SelectItem>
                          <SelectItem value="off_plan_first">Off-Plan first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => <Badge key={chip} variant="outline" className="rounded-full">{chip}</Badge>)}
                </div>
              </CardContent>
            </Card>

            {viewMode === "map" ? (
              <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5 xl:hidden">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Map</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{mapFocusLabel}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">{filteredListings.length} results</Badge>
                  </div>
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                    <iframe
                      title={`Property map for ${mapFocusLabel}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                      className="h-[260px] w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {filteredListings.length ? (
              <div className="space-y-4">
                {filteredListings.map((listing) => (
                  <ListingListRow key={listing.id} listing={listing} whatsappNumber={appConfig?.whatsapp_number} />
                ))}
              </div>
            ) : (
              <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
                <CardContent className="space-y-3 p-8">
                  <p className="text-xl font-semibold tracking-tight text-foreground">No properties match those filters.</p>
                  <p className="text-sm text-muted-foreground">
                    Broaden the range or ask the team to build a curated purchase shortlist.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" className="rounded-full" onClick={resetFilters}>Reset filters</Button>
                    <Button className="rounded-full" onClick={() => setOpenIntent(true)}>Request curated options</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {viewMode === "map" ? (
            <div className="hidden xl:block xl:sticky xl:top-24 xl:self-start">
              <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">Market map</p>
                      <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">{mapFocusLabel}</p>
                    </div>
                    <Badge variant="outline" className="rounded-full">{filteredListings.length} results</Badge>
                  </div>
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                    <iframe
                      title={`Property map for ${mapFocusLabel}`}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
                      className="h-[640px] w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Refine your property search</SheetTitle>
            <SheetDescription>Keep the essentials visible first, then expand More Filters only when you need deeper control.</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <PropertyFilterPanel
              filters={filters}
              setFilters={setFilters}
              propertyTypes={propertyTypes}
              areaOptions={areaOptions}
              advancedOpen={advancedOpen}
              setAdvancedOpen={setAdvancedOpen}
              onReset={resetFilters}
              className="border-none bg-transparent shadow-none"
            />
          </div>
        </SheetContent>
      </Sheet>

      <BuyerIntentSheet
        open={openIntent}
        onOpenChange={setOpenIntent}
        intentType="request_callback"
        title="Request a curated property shortlist"
      />
    </>
  );
}
