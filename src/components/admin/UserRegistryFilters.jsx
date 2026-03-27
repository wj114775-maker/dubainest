import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function UserRegistryFilters({ search, onSearchChange, status, onStatusChange }) {
  return (
    <div className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-card/80 p-4 md:flex-row md:items-center md:justify-between">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name or email"
        className="md:max-w-sm"
      />
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", value: "all" },
          { label: "Normal", value: "normal" },
          { label: "Suspended", value: "suspended" }
        ].map((item) => (
          <Button
            key={item.value}
            type="button"
            variant={status === item.value ? "default" : "outline"}
            className="rounded-full"
            onClick={() => onStatusChange(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}