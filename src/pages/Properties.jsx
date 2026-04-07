import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpDown, Bath, BedDouble, List, Map, Search, SlidersHorizontal } from "lucide-react";
import { createSearchParams, useSearchParams } from "react-router-dom";
import DeveloperPicker from "@/components/buyer/DeveloperPicker";
import ListingListRow from "@/components/buyer/ListingListRow";
import PropertyTypePicker from "@/components/buyer/PropertyTypePicker";
import PropertyDirectorySidebar from "@/components/buyer/PropertyDirectorySidebar";
import PropertyFilterPanel from "@/components/buyer/PropertyFilterPanel";
import SeoMeta from "@/components/seo/SeoMeta";
import BuyerIntentSheet from "@/components/leads/BuyerIntentSheet";
import SectionHeading from "@/components/common/SectionHeading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import useApprovedDevelopers from "@/hooks/useApprovedDevelopers";
import useAppConfig from "@/hooks/useAppConfig";
import { normalizeDeveloperQueryValue } from "@/lib/approvedDevelopers";
import { getShowcaseListings, loadBuyerListings } from "@/lib/buyerListings";
import { readPropertySearchLocations, recordPropertySearchLocation } from "@/lib/propertySearchInsights";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils";

const defaultFilters = {
  location: "",
  developer: "all",
  propertyCategory: "all",
  completionStatus: "all",
  propertyType: [],
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
  sortBy: "featured",
};

const getViewModeFromSearchParams = (searchParams) => searchParams.get("map_active") === "true" ? "map" : "list";

const parsePropertyTypeFilter = (value) => (
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);

const getPublicListingRank = (listing) => (
  Number(Boolean(listing.is_private_inventory)) * 40
  + Number(Boolean(listing.is_off_plan)) * 20
  + Number(Boolean(listing.permit_verified)) * 10
  + Math.min(Number(listing.price || 0) / 1000000, 50)
);

const filtersFromSearchParams = (searchParams) => ({
  ...defaultFilters,
  location: searchParams.get("q") || "",
  developer: searchParams.get("developer") || "all",
  propertyCategory: searchParams.get("category") || "all",
  completionStatus: searchParams.get("completion") || "all",
  propertyType: parsePropertyTypeFilter(searchParams.get("propertyType")),
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
  sortBy: searchParams.get("sort") || "featured",
});

const buildSearchParams = (filters) => {
  const params = {};

  if (filters.location.trim()) params.q = filters.location.trim();
  if (filters.developer !== "all") params.developer = filters.developer;
  if (filters.propertyCategory !== "all") params.category = filters.propertyCategory;
  if (filters.completionStatus !== "all") params.completion = filters.completionStatus;
  if (filters.propertyType.length) params.propertyType = filters.propertyType.join(",");
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
  if (filters.sortBy !== "featured") params.sort = filters.sortBy;

  return createSearchParams(params);
};

const countExtendedFilters = (filters) => [
  filters.minPrice !== "0",
  filters.maxPrice !== "0",
  filters.minArea !== "0",
  filters.maxArea !== "0",
  filters.parkingSpaces !== "any",
  filters.furnishingStatus !== "all",
  Boolean(filters.keywords.trim()),
  filters.withFloorPlans,
  filters.privateInventoryOnly,
].filter(Boolean).length;

const formatBedLabel = (value) => {
  if (value === "any") return "Beds";
  if (value === "0") return "Studio";
  return `${value} Beds`;
};

const formatBathLabel = (value) => {
  if (value === "any") return "Baths";
  return `${value} Baths`;
};

const filterFieldClassName = "h-11 w-full rounded-[1rem] border-slate-200 bg-white px-4 text-sm shadow-none";
const filterSelectClassName = "h-11 w-full rounded-[1rem] border-slate-200 bg-white px-4 text-sm shadow-none";

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: appConfig } = useAppConfig();
  const { data: approvedDevelopers = [] } = useApprovedDevelopers();
  const [openIntent, setOpenIntent] = useState(false);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState(() => filtersFromSearchParams(searchParams));
  const [viewMode, setViewMode] = useState(() => getViewModeFromSearchParams(searchParams));
  const [trackedLocations, setTrackedLocations] = useState([]);
  const lastTrackedQueryRef = useRef("");

  const { data: listings = [] } = useQuery({
    queryKey: ["buyer-properties-v3"],
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

  const featuredDeveloperNames = useMemo(() => (
    Object.entries(
      listings.reduce((accumulator, listing) => {
        const name = String(listing.developer_name || "").trim();
        if (!name) return accumulator;
        accumulator[name] = (accumulator[name] || 0) + 1;
        return accumulator;
      }, {})
    )
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 50)
      .map(([name]) => name)
  ), [listings]);

  useEffect(() => {
    setTrackedLocations(readPropertySearchLocations(locationCounts.map((item) => item.name), 4));
  }, [locationCounts]);

  useEffect(() => {
    const locationQuery = filters.location.trim();
    const querySignature = `${searchParams.toString()}::${locationQuery.toLowerCase()}`;
    if (!locationQuery || querySignature === lastTrackedQueryRef.current) return;

    const matchedLocation = locationCounts.find(
      (item) => item.name.toLowerCase() === locationQuery.toLowerCase()
    )?.name;

    if (!matchedLocation) return;

    recordPropertySearchLocation(matchedLocation);
    setTrackedLocations(readPropertySearchLocations(locationCounts.map((item) => item.name), 4));
    lastTrackedQueryRef.current = querySignature;
  }, [filters.location, locationCounts, searchParams]);

  const filteredListings = useMemo(() => {
    const searchTerm = filters.location.trim().toLowerCase();
    const keywordTerm = filters.keywords.trim().toLowerCase();
    const developerTerm = filters.developer === "all" ? "" : normalizeDeveloperQueryValue(filters.developer);

    const results = listings.filter((listing) => {
      const searchableText = [
        listing.title,
        listing.area_name,
        listing.project_name,
        listing.description,
        listing.property_type,
        listing.developer_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const listingDeveloperKey = normalizeDeveloperQueryValue(listing.developer_name || "");
      const matchesLocation = !searchTerm || searchableText.includes(searchTerm);
      const matchesDeveloper = !developerTerm || listingDeveloperKey.includes(developerTerm) || developerTerm.includes(listingDeveloperKey);
      const matchesPropertyCategory = filters.propertyCategory === "all" || listing.property_category === filters.propertyCategory;
      const matchesKeywords = !keywordTerm || searchableText.includes(keywordTerm);
      const matchesCompletion = filters.completionStatus === "all" || listing.completion_status === filters.completionStatus;
      const matchesPropertyType = !filters.propertyType.length || filters.propertyType.includes(listing.property_type);
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

      return matchesLocation
        && matchesDeveloper
        && matchesPropertyCategory
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
        && matchesPrivateInventory;
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
        case "featured":
        default:
          return getPublicListingRank(right) - getPublicListingRank(left) || Number(right.price || 0) - Number(left.price || 0);
      }
    });
  }, [filters, listings]);

  const extendedFilterCount = useMemo(() => countExtendedFilters(filters), [filters]);
  const mapFocusLabel = filters.location.trim() || filteredListings[0]?.area_name || "Dubai";
  const mapQuery = `${mapFocusLabel}, Dubai, UAE`;
  const hasActiveSearch = useMemo(
    () => JSON.stringify(filters) !== JSON.stringify(defaultFilters) || viewMode !== "list",
    [filters, viewMode]
  );
  const activeFilterLabels = useMemo(() => {
    const labels = [];

    if (filters.location.trim()) labels.push(`Area: ${filters.location.trim()}`);
    if (filters.developer !== "all") labels.push(`Developer: ${filters.developer}`);
    if (filters.propertyCategory !== "all") labels.push(`Category: ${filters.propertyCategory}`);
    if (filters.completionStatus !== "all") labels.push(filters.completionStatus === "off_plan" ? "Off-Plan" : "Ready");
    if (filters.propertyType.length) labels.push(...filters.propertyType.slice(0, 2));
    if (filters.bedrooms !== "any") labels.push(formatBedLabel(filters.bedrooms));
    if (filters.bathrooms !== "any") labels.push(formatBathLabel(filters.bathrooms));
    if (filters.privateInventoryOnly) labels.push("Private inventory");
    if (filters.withFloorPlans) labels.push("Floor plans");
    if (filters.sortBy !== "featured") labels.push(`Sort: ${String(filters.sortBy).replace(/_/g, " ")}`);

    return labels.slice(0, 7);
  }, [filters]);

  const resetFilters = () => {
    setFilters(defaultFilters);
    setViewMode("list");
    setAdvancedOpen(false);
    setFiltersPanelOpen(false);
  };

  const viewToggle = (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
      <button
        type="button"
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium",
          viewMode === "list" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
        )}
        onClick={() => setViewMode("list")}
      >
        <List className="h-4 w-4" />
        List
      </button>
      <button
        type="button"
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium",
          viewMode === "map" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
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
      <SeoMeta
        title="Properties for Sale in Dubai"
        description="Browse Dubai apartments, villas, penthouses, off-plan opportunities, and private inventory with a clean buyer-first directory."
        canonicalPath="/properties"
        robots={searchParams.toString() ? "noindex,follow" : "index,follow"}
        jsonLd={buildBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Properties", path: "/properties" },
        ])}
      />
      <div className="space-y-6 pb-28">
        <SectionHeading
          eyebrow="Property purchase"
          title="Properties for sale in Dubai"
          description="Browse apartments, villas, penthouses, and off-plan opportunities with a cleaner buyer-first list view."
          titleAs="h1"
          action={<Button className="rounded-full px-5" onClick={() => setOpenIntent(true)}>Request curated shortlist</Button>}
        />

        <div className="sticky top-0 z-30 hidden rounded-[1.5rem] bg-white pb-4 xl:block">
          <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-4 p-4">
              <div className="grid items-center gap-3 xl:grid-cols-[minmax(0,2.8fr)_minmax(15rem,1.7fr)_minmax(14rem,1.45fr)_11rem]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.location}
                    onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Search areas, communities, towers, or projects"
                    className={cn(filterFieldClassName, "pl-10")}
                  />
                </div>

                <DeveloperPicker
                  value={filters.developer}
                  onChange={(value) => setFilters((current) => ({ ...current, developer: value }))}
                  developers={approvedDevelopers}
                  featuredDeveloperNames={featuredDeveloperNames}
                  placeholder="Developer"
                  triggerClassName="w-full"
                />

                <PropertyTypePicker
                  categoryValue={filters.propertyCategory}
                  value={filters.propertyType}
                  onCategoryChange={(value) => setFilters((current) => ({ ...current, propertyCategory: value }))}
                  onValueChange={(value) => setFilters((current) => ({ ...current, propertyType: value }))}
                  triggerClassName="w-full"
                />

                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-11 justify-between rounded-[1rem] border-slate-200 bg-white px-4 text-sm shadow-none",
                    extendedFilterCount ? "border-amber-400 bg-amber-50 text-amber-900 shadow-sm" : ""
                  )}
                  onClick={() => setFiltersPanelOpen(true)}
                >
                  More Filters
                  {extendedFilterCount ? <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">{extendedFilterCount}</span> : null}
                </Button>
              </div>

              <div className="grid items-center gap-3 xl:grid-cols-[minmax(0,1.8fr)_9.5rem_9.5rem_12rem_auto]">
                <div className="grid grid-cols-3 gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 p-1">
                  {[
                    { value: "all", label: "All" },
                    { value: "ready", label: "Ready" },
                    { value: "off_plan", label: "Off-Plan" },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={filters.completionStatus === option.value ? "default" : "ghost"}
                      className={cn(
                        "h-9 rounded-[0.85rem] px-3 text-sm shadow-none",
                        filters.completionStatus === option.value
                          ? "bg-foreground text-background hover:bg-foreground"
                          : "text-slate-600 hover:bg-white hover:text-slate-950"
                      )}
                      onClick={() => setFilters((current) => ({ ...current, completionStatus: option.value }))}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                <Select value={filters.bedrooms} onValueChange={(value) => setFilters((current) => ({ ...current, bedrooms: value }))}>
                  <SelectTrigger className={filterSelectClassName}>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <span>{formatBedLabel(filters.bedrooms)}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Beds</SelectItem>
                    <SelectItem value="0">Studio</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                    <SelectItem value="6">6+</SelectItem>
                    <SelectItem value="8">8+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.bathrooms} onValueChange={(value) => setFilters((current) => ({ ...current, bathrooms: value }))}>
                  <SelectTrigger className={filterSelectClassName}>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span>{formatBathLabel(filters.bathrooms)}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Baths</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                    <SelectItem value="6">6+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sortBy} onValueChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}>
                  <SelectTrigger className="h-11 rounded-[1rem] border-slate-200 bg-white px-4 text-sm shadow-none">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price_low_high">Price: low to high</SelectItem>
                    <SelectItem value="price_high_low">Price: high to low</SelectItem>
                    <SelectItem value="size_large_small">Largest size</SelectItem>
                    <SelectItem value="off_plan_first">Off-Plan first</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center justify-end gap-3">
                  <Button
                    variant="ghost"
                    className={cn(
                      "min-w-[7.75rem] rounded-full px-4 text-sm transition-opacity",
                      hasActiveSearch ? "text-foreground" : "text-slate-300 hover:bg-transparent hover:text-slate-300"
                    )}
                    onClick={resetFilters}
                    disabled={!hasActiveSearch}
                  >
                    Reset search
                  </Button>
                  {viewToggle}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="sticky top-0 z-30 space-y-4 rounded-[1.5rem] bg-white pb-4 xl:hidden">
          <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.08)]">
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative sm:col-span-2">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={filters.location}
                    onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
                    placeholder="Search areas, communities, towers, or projects"
                    className={cn(filterFieldClassName, "pl-10")}
                  />
                </div>

                <DeveloperPicker
                  value={filters.developer}
                  onChange={(value) => setFilters((current) => ({ ...current, developer: value }))}
                  developers={approvedDevelopers}
                  featuredDeveloperNames={featuredDeveloperNames}
                  placeholder="Developer"
                  triggerClassName="sm:col-span-2"
                />

                <PropertyTypePicker
                  categoryValue={filters.propertyCategory}
                  value={filters.propertyType}
                  onCategoryChange={(value) => setFilters((current) => ({ ...current, propertyCategory: value }))}
                  onValueChange={(value) => setFilters((current) => ({ ...current, propertyType: value }))}
                  triggerClassName="sm:col-span-2"
                />

                <Select value={filters.bedrooms} onValueChange={(value) => setFilters((current) => ({ ...current, bedrooms: value }))}>
                  <SelectTrigger className={filterSelectClassName}>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <span>{formatBedLabel(filters.bedrooms)}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Beds</SelectItem>
                    <SelectItem value="0">Studio</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                    <SelectItem value="6">6+</SelectItem>
                    <SelectItem value="8">8+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.bathrooms} onValueChange={(value) => setFilters((current) => ({ ...current, bathrooms: value }))}>
                  <SelectTrigger className={filterSelectClassName}>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span>{formatBathLabel(filters.bathrooms)}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Baths</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                    <SelectItem value="5">5+</SelectItem>
                    <SelectItem value="6">6+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-[1rem] border border-slate-200 bg-slate-50 p-1">
                {[
                  { value: "all", label: "All" },
                  { value: "ready", label: "Ready" },
                  { value: "off_plan", label: "Off-Plan" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={filters.completionStatus === option.value ? "default" : "ghost"}
                    className={cn(
                      "h-9 rounded-[0.85rem] px-3 text-sm shadow-none",
                      filters.completionStatus === option.value
                        ? "bg-foreground text-background hover:bg-foreground"
                        : "text-slate-600 hover:bg-white hover:text-slate-950"
                    )}
                    onClick={() => setFilters((current) => ({ ...current, completionStatus: option.value }))}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
                <Button
                  variant="outline"
                  className={cn(
                    "h-11 justify-between rounded-[1rem] border-slate-200 bg-white px-4 text-sm shadow-none",
                    extendedFilterCount ? "border-amber-400 bg-amber-50 text-amber-900 shadow-sm" : ""
                  )}
                  onClick={() => setFiltersPanelOpen(true)}
                >
                  <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    More Filters
                  </span>
                  {extendedFilterCount ? <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">{extendedFilterCount}</span> : null}
                </Button>

                <Select value={filters.sortBy} onValueChange={(value) => setFilters((current) => ({ ...current, sortBy: value }))}>
                  <SelectTrigger className="h-11 rounded-[1rem] border-slate-200 bg-white px-4 text-sm shadow-none">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price_low_high">Price: low to high</SelectItem>
                    <SelectItem value="price_high_low">Price: high to low</SelectItem>
                    <SelectItem value="size_large_small">Largest size</SelectItem>
                    <SelectItem value="off_plan_first">Off-Plan first</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    className={cn(
                      "min-w-[7.75rem] rounded-full px-4 text-sm transition-opacity",
                      hasActiveSearch ? "text-foreground" : "text-slate-300 hover:bg-transparent hover:text-slate-300"
                    )}
                    onClick={resetFilters}
                    disabled={!hasActiveSearch}
                  >
                    Reset search
                  </Button>
                  {viewToggle}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className={cn("grid gap-6", viewMode === "map" ? "xl:grid-cols-[minmax(0,780px),390px]" : "xl:grid-cols-[minmax(0,780px),320px] xl:justify-center")}>
          <div className="space-y-4 xl:max-w-[780px]">
            <Card className="rounded-[1.85rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">Directory overview</p>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                      {filteredListings.length} properties ready to review
                    </h2>
                    <p className="text-sm leading-7 text-slate-600">
                      Sale-only stock routed through a cleaner browse experience with project and developer context built in.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                      {viewMode === "map" ? "Map view" : "List view"}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-3.5 py-1.5 text-slate-700">
                      {filters.completionStatus === "all" ? "All sale stock" : filters.completionStatus === "off_plan" ? "Off-Plan focus" : "Ready stock focus"}
                    </Badge>
                  </div>
                </div>

                {activeFilterLabels.length ? (
                  <div className="flex flex-wrap gap-2">
                    {activeFilterLabels.map((label) => (
                      <Badge key={label} variant="outline" className="rounded-full border-slate-200 bg-white px-3.5 py-1.5 text-slate-700">
                        {label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                    Start with an area, project, or developer to narrow the directory without losing the broader purchase context.
                  </div>
                )}
              </CardContent>
            </Card>

            {viewMode === "map" ? (
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)] xl:hidden">
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
              <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
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
            <div className="hidden xl:block xl:sticky xl:top-[10.5rem] xl:self-start">
              <Card className="overflow-hidden rounded-[2rem] border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
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
                      className="h-[680px] w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="hidden xl:block xl:sticky xl:top-[10.5rem] xl:self-start">
              <PropertyDirectorySidebar locations={trackedLocations} />
            </div>
          )}
        </div>
      </div>

      <Sheet open={filtersPanelOpen} onOpenChange={setFiltersPanelOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>More filters</SheetTitle>
            <SheetDescription>Refine price, area, features, and special requirements.</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <PropertyFilterPanel
              filters={filters}
              setFilters={setFilters}
              developers={approvedDevelopers}
              featuredDeveloperNames={featuredDeveloperNames}
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
