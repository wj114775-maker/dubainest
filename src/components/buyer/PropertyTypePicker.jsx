import React, { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getPropertyTypeCategory, getPropertyTypeGroups, getPropertyTypeLabel } from "@/lib/propertyTaxonomy";
import { cn } from "@/lib/utils";

const categoryOptions = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
];

export default function PropertyTypePicker({
  categoryValue = "all",
  value = [],
  onCategoryChange,
  onValueChange,
  triggerClassName,
  contentClassName,
  placeholder = "Property type",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const groups = getPropertyTypeGroups();
  const [activeCategory, setActiveCategory] = useState(categoryValue === "commercial" ? "commercial" : "residential");
  const selectedValues = useMemo(() => (
    Array.isArray(value)
      ? value.filter(Boolean)
      : value && value !== "all"
        ? [value]
        : []
  ), [value]);

  const filteredOptions = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    const categories = [activeCategory];
    return categories.flatMap((category) =>
      groups[category]
        .filter((item) => item.toLowerCase().includes(searchTerm))
        .map((item) => ({ category, label: item, value: item }))
    );
  }, [activeCategory, groups, search]);

  const triggerLabel = selectedValues.length || categoryValue !== "all"
    ? getPropertyTypeLabel(categoryValue, selectedValues)
    : placeholder;

  const applyCategory = (nextCategory) => {
    const categoryChanged = activeCategory !== nextCategory;
    setActiveCategory(nextCategory);
    onCategoryChange(nextCategory);
    if (categoryChanged) {
      onValueChange([]);
    }
  };

  const toggleValue = (nextValue) => {
    const nextSelectedValues = selectedValues.includes(nextValue)
      ? selectedValues.filter((item) => item !== nextValue)
      : [...selectedValues, nextValue];

    onCategoryChange(activeCategory);
    onValueChange(nextSelectedValues);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          setActiveCategory(categoryValue === "all" ? getPropertyTypeCategory(selectedValues) : categoryValue || "residential");
        } else {
          setSearch("");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("justify-between rounded-[1rem] border-slate-200 bg-white text-left font-normal", triggerClassName)}>
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn("w-[27rem] max-w-[calc(100vw-2rem)] rounded-[1.1rem] border-slate-200 bg-white p-0 shadow-[0_0.6rem_1.6rem_rgba(15,23,42,0.16)]", contentClassName)}>
        <div className="space-y-4 p-4">
          <div className="flex items-center gap-2 rounded-[0.9rem] bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter property type"
              className="h-auto border-none px-0 py-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[0.9rem] bg-slate-100 p-1">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => applyCategory(option.value)}
                className={cn(
                  "rounded-[0.8rem] px-4 py-2 text-sm font-medium transition-colors",
                  activeCategory === option.value
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-white hover:text-slate-950"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {filteredOptions.map((option) => (
              <button
                key={`${option.category}-${option.value}`}
                type="button"
                onClick={() => toggleValue(option.value)}
                className={cn(
                  "flex items-center justify-between rounded-[1rem] border px-3 py-2.5 text-left text-sm transition-colors",
                  selectedValues.includes(option.value)
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                )}
              >
                <span>{option.label}</span>
                <Check className={cn("h-4 w-4", selectedValues.includes(option.value) ? "opacity-100" : "opacity-0")} />
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full px-4 text-slate-600"
              onClick={() => {
                onCategoryChange("all");
                onValueChange([]);
                setActiveCategory("residential");
                setSearch("");
              }}
            >
              Reset
            </Button>
            <div className="text-xs font-medium text-slate-500">
              {selectedValues.length ? `${selectedValues.length} selected` : "Select one or more"}
            </div>
            <Button type="button" className="rounded-full px-5" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
