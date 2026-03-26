import React from "react";
import { Input } from "@/components/ui/input";

export default function UserRegistryFilters({ search, onSearchChange, status, onStatusChange }) {
  return (
    <div className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-card/80 p-4 md:flex-row md:items-center">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name or email"
        className="md:max-w-sm"
      />
      <div className="flex gap-2">
        {[
          { label: "All", value: "all" },
          { label: "Normal", value: "normal" },
          { label: "Suspended", value: "suspended" }
        ].map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onStatusChange(item.value)}
            className={`rounded-full border px-4 py-2 text-sm transition ${status === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-foreground"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}