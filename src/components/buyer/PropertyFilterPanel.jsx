import React, { useMemo } from "react";
import { Bath, BedDouble, ChevronDown, Filter, Sparkles } from "lucide-react";
import DeveloperPicker from "@/components/buyer/DeveloperPicker";
import PropertyTypePicker from "@/components/buyer/PropertyTypePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const priceSteps = ["0", "1000000", "2000000", "3000000", "5000000", "7500000", "10000000", "15000000", "25000000", "50000000"];
const areaSteps = ["0", "500", "1000", "1500", "2000", "3000", "5000", "7500", "10000", "15000"];
const advancedKeys = ["parkingSpaces", "furnishingStatus", "keywords", "withFloorPlans", "privateInventoryOnly"];

const formatPrice = (value) => {
  if (value === "0") return "Any";
  const number = Number(value);
  if (number >= 1000000) return `AED ${(number / 1000000).toFixed(number % 1000000 === 0 ? 0 : 1)}M`;
  return `AED ${number.toLocaleString()}`;
};

const formatArea = (value) => {
  if (value === "0") return "Any";
  return `${Number(value).toLocaleString()} sqft`;
};

const formatBedLabel = (value) => {
  if (value === "any") return "Beds";
  if (value === "0") return "Studio";
  return `${value} Beds`;
};

const formatBathLabel = (value) => {
  if (value === "any") return "Baths";
  return `${value} Baths`;
};

export default function PropertyFilterPanel({
  filters,
  setFilters,
  developers = [],
  featuredDeveloperNames = [],
  areaOptions = [],
  advancedOpen,
  setAdvancedOpen,
  onReset,
  className,
}) {
  const advancedActive = useMemo(
    () => advancedKeys.filter((key) => {
      const value = filters[key];
      if (typeof value === "boolean") return value;
      return value && value !== "all" && value !== "any" && value !== "0";
    }),
    [filters]
  );

  const updateField = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <Card className={cn("h-fit rounded-[2rem] border-white/10 bg-card/95 shadow-xl shadow-black/5", className)}>
      <CardContent className="space-y-5 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">More filters</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">Refine price, area, features, and buyer requirements</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Filter className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Location</p>
          <Input
            value={filters.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="Dubai, Palm Jumeirah, Downtown..."
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Developer</p>
          <DeveloperPicker
            value={filters.developer}
            onChange={(value) => updateField("developer", value)}
            developers={developers}
            featuredDeveloperNames={featuredDeveloperNames}
            placeholder="Any developer"
            triggerClassName="h-10 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Completion Status</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "all", label: "All" },
              { value: "ready", label: "Ready" },
              { value: "off_plan", label: "Off-Plan" },
            ].map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={filters.completionStatus === option.value ? "default" : "outline"}
                className="rounded-2xl"
                onClick={() => updateField("completionStatus", option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Property Type</p>
          <PropertyTypePicker
            categoryValue={filters.propertyCategory}
            value={filters.propertyType}
            onCategoryChange={(value) => updateField("propertyCategory", value)}
            onValueChange={(value) => updateField("propertyType", value)}
            triggerClassName="h-10 rounded-2xl"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Beds</p>
            <Select value={filters.bedrooms} onValueChange={(value) => updateField("bedrooms", value)}>
              <SelectTrigger className="rounded-2xl">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-4 w-4 text-muted-foreground" />
                  <span>{formatBedLabel(filters.bedrooms)}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
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
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Baths</p>
            <Select value={filters.bathrooms} onValueChange={(value) => updateField("bathrooms", value)}>
              <SelectTrigger className="rounded-2xl">
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-muted-foreground" />
                  <span>{formatBathLabel(filters.bathrooms)}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
                <SelectItem value="6">6+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Price (AED)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={filters.minPrice} onValueChange={(value) => updateField("minPrice", value)}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Min" /></SelectTrigger>
              <SelectContent>
                {priceSteps.map((step) => <SelectItem key={`min-${step}`} value={step}>{step === "0" ? "Min price" : formatPrice(step)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.maxPrice} onValueChange={(value) => updateField("maxPrice", value)}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Max" /></SelectTrigger>
              <SelectContent>
                {priceSteps.map((step) => <SelectItem key={`max-${step}`} value={step}>{step === "0" ? "Max price" : formatPrice(step)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Area (sqft)</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select value={filters.minArea} onValueChange={(value) => updateField("minArea", value)}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Min area" /></SelectTrigger>
              <SelectContent>
                {areaSteps.map((step) => <SelectItem key={`min-area-${step}`} value={step}>{step === "0" ? "Min area" : formatArea(step)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.maxArea} onValueChange={(value) => updateField("maxArea", value)}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Max area" /></SelectTrigger>
              <SelectContent>
                {areaSteps.map((step) => <SelectItem key={`max-area-${step}`} value={step}>{step === "0" ? "Max area" : formatArea(step)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <div className={cn(
            "rounded-[1.4rem] border p-3 transition",
            advancedActive.length
              ? "border-amber-300/40 bg-amber-500/5"
              : "border-white/10 bg-background/60"
          )}>
            <CollapsibleTrigger asChild>
              <button type="button" className="flex w-full items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">More Filters</p>
                  <p className="mt-1 text-sm text-foreground">
                    {advancedActive.length ? `${advancedActive.length} advanced filters active` : "Expand for more options"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {advancedActive.length ? <Badge className="rounded-full bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">{advancedActive.length} active</Badge> : null}
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition", advancedOpen ? "rotate-180" : "")} />
                </div>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Parking Spaces</p>
                  <Select value={filters.parkingSpaces} onValueChange={(value) => updateField("parkingSpaces", value)}>
                    <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1+</SelectItem>
                      <SelectItem value="2">2+</SelectItem>
                      <SelectItem value="3">3+</SelectItem>
                      <SelectItem value="4">4+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Furnishing</p>
                  <Select value={filters.furnishingStatus} onValueChange={(value) => updateField("furnishingStatus", value)}>
                    <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Any" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      <SelectItem value="furnished">Furnished</SelectItem>
                      <SelectItem value="semi_furnished">Semi furnished</SelectItem>
                      <SelectItem value="unfurnished">Unfurnished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Keywords</p>
                <Input
                  value={filters.keywords}
                  onChange={(event) => updateField("keywords", event.target.value)}
                  placeholder="sea view, branded, golf, marina..."
                  className="rounded-2xl"
                />
              </div>

              <div className="space-y-3 rounded-[1.2rem] border border-white/10 bg-background/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Properties with Floor Plans</p>
                    <p className="text-xs text-muted-foreground">Keep this close to Bayut’s buyer workflow.</p>
                  </div>
                  <Switch checked={filters.withFloorPlans} onCheckedChange={(checked) => updateField("withFloorPlans", checked)} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Private Inventory only</p>
                    <p className="text-xs text-muted-foreground">Unique premium-stock control for your platform.</p>
                  </div>
                  <Switch checked={filters.privateInventoryOnly} onCheckedChange={(checked) => updateField("privateInventoryOnly", checked)} />
                </div>

              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {advancedActive.length ? (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="rounded-full border-amber-300/40 bg-amber-500/5 text-amber-700">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Advanced filters edited
            </Badge>
          </div>
        ) : null}

        {areaOptions.length ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">Popular locations</p>
            <div className="flex flex-wrap gap-2">
              {areaOptions.slice(0, 6).map((area) => (
                <Button
                  key={area}
                  type="button"
                  variant={filters.location === area ? "default" : "outline"}
                  className="rounded-full px-4 text-xs"
                  onClick={() => updateField("location", filters.location === area ? "" : area)}
                >
                  {area}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <Button variant="outline" className="w-full rounded-full" onClick={onReset}>
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );
}
