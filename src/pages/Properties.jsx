import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, ChevronDown, SlidersHorizontal } from "lucide-react";
import { createSearchParams, useSearchParams } from "react-router-dom";
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

const filterSummaryChips = (filters) => {
  const chips = ["Buy", "List view"];

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
  if (filters.showcaseOnly) chips.push("Showcase only");

  return chips;
};

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openIntent, setOpenIntent] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [locationsExpanded, setLocationsExpanded] = useState(false);
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams));

  const { data: listings = [] } = useQuery({
    queryKey: ["buyer-properties-v2"],
    queryFn: () => loadBuyerListings({ limit: 24, includeShowcase: true }),
    initialData: [],
  });

  useEffect(() => {
    const next = filtersFromSearchParams(searchParams);
    const nextString = JSON.stringify(next);
    const currentString = JSON.stringify(filters);
    if (nextString !== currentString) {
      setFilters(next);
    }
  }, [searchParams]);

  useEffect(() => {
    const nextParams = buildSearchParams(filters).toString();
    const currentParams = searchParams.toString();
    if (nextParams !== currentParams) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters]);

  const propertyTypes = useMemo(
    () => Array.from(new Set(listings.map((listing) => listing.property_type).filter(Boolean))).sort(),
    [listings]
  );

  const showcaseListings = useMemo(() => getShowcaseListings(4), []);

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
      const matchesCompletion =
        filters.completionStatus === "all" || listing.completion_status === filters.completionStatus;
      const matchesPropertyType =
        filters.propertyType === "all" || listing.property_type === filters.propertyType;
      const matchesBedrooms =
        filters.bedrooms === "any" || Number(listing.bedrooms || 0) >= Number(filters.bedrooms);
      const matchesBathrooms =
        filters.bathrooms === "any" || Number(listing.bathrooms || 0) >= Number(filters.bathrooms);
      const matchesMinPrice = filters.minPrice === "0" || Number(listing.price || 0) >= Number(filters.minPrice);
      const matchesMaxPrice = filters.maxPrice === "0" || Number(listing.price || 0) <= Number(filters.maxPrice);
      const matchesMinArea = filters.minArea === "0" || Number(listing.built_up_area_sqft || 0) >= Number(filters.minArea);
      const matchesMaxArea = filters.maxArea === "0" || Number(listing.built_up_area_sqft || 0) <= Number(filters.maxArea);
      const matchesParking =
        filters.parkingSpaces === "any" || Number(listing.parking_spaces || 0) >= Number(filters.parkingSpaces);
      const matchesFurnishing =
        filters.furnishingStatus === "all" || listing.furnishing_status === filters.furnishingStatus;
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
          return Number(left.price || 0) - Number(right.price || 0);
        case "price_high_low":
          return Number(right.price || 0) - Number(left.price || 0);
        case "size_large_small":
          return Number(right.built_up_area_sqft || 0) - Number(left.built_up_area_sqft || 0);
        case "off_plan_first":
          return Number(Boolean(right.is_off_plan)) - Number(Boolean(left.is_off_plan));
        case "popular":
        default:
          return Number(right.trust_score || 0) - Number(left.trust_score || 0);
      }
    });
  }, [filters, listings]);

  const liveCount = listings.filter((listing) => !isShowcaseListing(listing)).length;
  const filteredLiveCount = filteredListings.filter((listing) => !isShowcaseListing(listing)).length;
  const offPlanCount = filteredListings.filter((listing) => listing.is_off_plan).length;
  const showingShowcaseOnly = listings.length > 0 && liveCount === 0;
  const chips = useMemo(() => filterSummaryChips(filters), [filters]);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setAdvancedOpen(false);
  };

  return (
    <>
      <div className="space-y-8 pb-28">
        <SectionHeading
          eyebrow="Property purchase"
          title="A purchase-first property directory shaped by Bayut and REA patterns"
          description="Purpose stays fixed to buy. The filter stack follows the clearest market language: location, completion status, property type, beds & baths, price, area, and an expandable More Filters layer."
          action={<Button className="rounded-full px-5" onClick={() => setOpenIntent(true)}>Request curated shortlist</Button>}
        />

        <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
          <CardContent className="space-y-4 p-5 md:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Popular Dubai locations</p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">Jump into a market the same way Bayut surfaces location-first buying paths</p>
              </div>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setFilters((current) => ({ ...current, showcaseOnly: true, sortBy: "off_plan_first" }))}
              >
                Open demo stock
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
                  <p className="text-sm text-muted-foreground">{offPlanCount} off-plan and {filteredLiveCount} live listings currently visible.</p>
                </div>
                <Button variant="outline" className="rounded-full" onClick={() => setMobileFiltersOpen(true)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr,220px]">
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip) => <Badge key={chip} variant="outline" className="rounded-full">{chip}</Badge>)}
                </div>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Popular</SelectItem>
                    <SelectItem value="price_low_high">Price low to high</SelectItem>
                    <SelectItem value="price_high_low">Price high to low</SelectItem>
                    <SelectItem value="size_large_small">Largest size</SelectItem>
                    <SelectItem value="off_plan_first">Off-Plan first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {liveCount > 0 ? (
          <Card className="rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5">
            <CardContent className="space-y-4 p-5 md:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Featured demo stock</p>
                  <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">Styled showcase listings are still available here</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setFilters((current) => ({ ...current, showcaseOnly: true }))}
                >
                  Show showcase only
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {showcaseListings.map((listing) => (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => setFilters((current) => ({
                      ...current,
                      showcaseOnly: true,
                      completionStatus: listing.is_off_plan ? "off_plan" : current.completionStatus,
                    }))}
                    className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-background/70 text-left transition hover:border-primary/25 hover:bg-background"
                  >
                    <img src={listing.hero_image_url} alt={listing.title} className="h-40 w-full object-cover" />
                    <div className="space-y-2 p-4">
                      <div className="flex flex-wrap gap-2">
                        {listing.is_off_plan ? <Badge className="bg-sky-950 text-white hover:bg-sky-950">Off-Plan</Badge> : <Badge className="bg-emerald-700 text-white hover:bg-emerald-700">Ready</Badge>}
                        <Badge variant="outline" className="rounded-full">Showcase</Badge>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{listing.title}</p>
                      <p className="text-sm text-muted-foreground">{listing.area_name}</p>
                      <p className="text-sm font-medium text-foreground">AED {Number(listing.price || 0).toLocaleString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
          <div className="hidden xl:block">
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

          <div className="space-y-5">
            <Card className="hidden rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5 xl:block">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{filteredListings.length} purchase listings</p>
                    <p className="text-sm text-muted-foreground">
                      {offPlanCount} off-plan options, {filteredListings.filter((listing) => listing.is_private_inventory).length} private inventory entries, and {filteredLiveCount} live records in the current catalogue.
                    </p>
                  </div>
                  <div className="w-full lg:w-[240px]">
                    <Select value={filters.sortBy} onValueChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}>
                      <SelectTrigger className="rounded-full">
                        <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popular">Popular</SelectItem>
                        <SelectItem value="price_low_high">Price low to high</SelectItem>
                        <SelectItem value="price_high_low">Price high to low</SelectItem>
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

            {showingShowcaseOnly ? (
              <Card className="rounded-[2rem] border-primary/20 bg-primary/5">
                <CardContent className="space-y-2 p-6">
                  <p className="text-sm font-semibold text-foreground">Live partner stock is still being published.</p>
                  <p className="text-sm text-muted-foreground">
                    Showcase listings with real photography are filling the directory so the experience stays polished while the live feed grows.
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
