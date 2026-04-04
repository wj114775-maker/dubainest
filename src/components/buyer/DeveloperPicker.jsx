import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function DeveloperPicker({
  value,
  onChange,
  developers = [],
  placeholder = "Developer",
  className,
  triggerClassName,
  contentClassName,
}) {
  const [open, setOpen] = useState(false);

  const selectedDeveloper = useMemo(
    () => developers.find((item) => item.value === value) || null,
    [developers, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between rounded-[1rem] border-slate-200 bg-white text-left font-normal", triggerClassName)}
        >
          <span className="truncate">
            {selectedDeveloper ? selectedDeveloper.displayName : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-[360px] rounded-[1.4rem] border-slate-200 p-0 shadow-xl", contentClassName)} align="start">
        <Command className={className}>
          <CommandInput placeholder="Search developer" className="h-11 text-sm" />
          <CommandList className="max-h-[340px]">
            <CommandEmpty>No developer found.</CommandEmpty>
            <CommandGroup heading="Developers">
              <CommandItem
                value="Any developer"
                onSelect={() => {
                  onChange("all");
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

              {developers.map((developer) => (
                <CommandItem
                  key={developer.id}
                  value={`${developer.englishName} ${developer.displayName} ${developer.officeNumber} ${developer.arabicName} ${developer.searchKey}`}
                  onSelect={() => {
                    onChange(developer.value);
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
