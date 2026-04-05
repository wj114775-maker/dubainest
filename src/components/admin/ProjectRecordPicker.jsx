import React, { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function ProjectRecordPicker({ value, onChange, projects = [], placeholder = "Search project source" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProjects = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    if (!term) return projects.slice(0, 80);
    return projects.filter((project) => (
      String(project.name || "").toLowerCase().includes(term)
      || String(project.slug || "").toLowerCase().includes(term)
      || String(project.status || "").toLowerCase().includes(term)
    )).slice(0, 80);
  }, [projects, search]);

  const selected = projects.find((project) => project.id === value) || null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="justify-between rounded-[1rem] border-slate-200 bg-white font-normal">
          <span className="truncate">{selected ? selected.name : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] rounded-[1.4rem] border-slate-200 p-0 shadow-xl" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder="Search project source" className="h-11 text-sm" />
          <CommandList className="max-h-[340px]">
            <CommandEmpty>No project found.</CommandEmpty>
            <CommandGroup heading="Projects">
              <CommandItem
                value="Manual project"
                onSelect={() => {
                  onChange("");
                  setSearch("");
                  setOpen(false);
                }}
                className="rounded-xl px-3 py-3"
              >
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">Manual project</p>
                    <p className="text-xs text-muted-foreground">Do not link to an operational project yet</p>
                  </div>
                  <Check className={cn("h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                </div>
              </CommandItem>

              {filteredProjects.map((project) => (
                <CommandItem
                  key={project.id}
                  value={`${project.name} ${project.slug || ""} ${project.status || ""}`}
                  onSelect={() => {
                    onChange(project.id);
                    setSearch("");
                    setOpen(false);
                  }}
                  className="rounded-xl px-3 py-3"
                >
                  <div className="flex flex-1 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{project.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{project.slug || project.status || "Project source"}</p>
                    </div>
                    <Check className={cn("h-4 w-4", value === project.id ? "opacity-100" : "opacity-0")} />
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
