import React, { useDeferredValue, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { normalizeDeveloperQueryValue } from "@/lib/approvedDevelopers";
import { cn } from "@/lib/utils";

const INITIAL_DEVELOPER_LIMIT = 50;
const SEARCH_RESULT_LIMIT = 80;

export default function DeveloperPicker({
  value,
  onChange,
  developers = [],
  featuredDeveloperNames = [],
  placeholder = "Developer",
  className,
  triggerClassName,
  contentClassName,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  const selectedDeveloper = useMemo(
    () => developers.find((item) => item.value === value) || null,
    [developers, value]
  );

  const featuredDevelopers = useMemo(() => {
    const featuredWeights = new Map(
      featuredDeveloperNames
        .map((name, index) => [normalizeDeveloperQueryValue(name), index])
        .filter(([name]) => Boolean(name))
    );

    const featured = developers.filter((developer) => (
      featuredWeights.has(developer.searchKey)
      || featuredWeights.has(normalizeDeveloperQueryValue(developer.value))
      || featuredWeights.has(normalizeDeveloperQueryValue(developer.displayName))
    ));

    return featured.sort((left, right) => (
      (featuredWeights.get(left.searchKey) ?? featuredWeights.get(normalizeDeveloperQueryValue(left.value)) ?? Number.MAX_SAFE_INTEGER)
      - (featuredWeights.get(right.searchKey) ?? featuredWeights.get(normalizeDeveloperQueryValue(right.value)) ?? Number.MAX_SAFE_INTEGER)
    ));
  }, [developers, featuredDeveloperNames]);

  const visibleDevelopers = useMemo(() => {
    if (!deferredSearch) {
      const seed = featuredDevelopers.length ? featuredDevelopers : developers;
      return seed.slice(0, INITIAL_DEVELOPER_LIMIT);
    }

    return developers
      .filter((developer) => (
        developer.searchKey.includes(normalizeDeveloperQueryValue(deferredSearch))
        || developer.englishName.toLowerCase().includes(deferredSearch)
        || developer.displayName.toLowerCase().includes(deferredSearch)
        || developer.officeNumber.toLowerCase().includes(deferredSearch)
        || developer.arabicName.includes(search.trim())
      ))
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [deferredSearch, developers, featuredDevelopers, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-11 w-full justify-between rounded-[1rem] border-slate-200 bg-white px-4 text-left font-normal shadow-none", triggerClassName)}
        >
          <span className="truncate">
            {selectedDeveloper ? selectedDeveloper.displayName : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[min(24rem,calc(100vw-2rem))] min-w-[18rem] rounded-[1.4rem] border-slate-200 p-0 shadow-xl sm:w-[22rem]", contentClassName)} align="start">
        <Command shouldFilter={false} className={className}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Search developer"
            className="h-11 text-sm"
          />
          <CommandList className="max-h-[340px]">
            <CommandEmpty>No developer found.</CommandEmpty>
            <CommandGroup heading={deferredSearch ? "Developers" : "Top developers"}>
              <CommandItem
                value="Any developer"
                onSelect={() => {
                  onChange("all");
                  setSearch("");
                  setOpen(false);
                }}
                className="rounded-xl px-3 py-3"
              >
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">Any developer</p>
                    <p className="text-xs text-muted-foreground">Show all approved developers</p>
                  </div>
                  <Check className={cn("h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")} />
                </div>
              </CommandItem>

              {visibleDevelopers.map((developer) => (
                <CommandItem
                  key={developer.id}
                  value={`${developer.englishName} ${developer.displayName} ${developer.officeNumber} ${developer.arabicName} ${developer.searchKey}`}
                  onSelect={() => {
                    onChange(developer.value);
                    setSearch("");
                    setOpen(false);
                  }}
                  className="rounded-xl px-3 py-3"
                >
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{developer.displayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{developer.englishName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {developer.officeNumber ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">{developer.officeNumber}</span> : null}
                      <Check className={cn("h-4 w-4", value === developer.value ? "opacity-100" : "opacity-0")} />
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
