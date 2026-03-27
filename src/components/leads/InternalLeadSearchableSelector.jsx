import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function InternalLeadSearchableSelector({ placeholder, searchPlaceholder, emptyLabel, value, onChange, options = [], helper }) {
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => `${option.label} ${option.helper || ""}`.toLowerCase().includes(term));
  }, [options, query]);

  return (
    <div className="space-y-3">
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={searchPlaceholder} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          {filteredOptions.length ? filteredOptions.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>) : <SelectItem value="__empty" disabled>{emptyLabel}</SelectItem>}
        </SelectContent>
      </Select>
      {helper ? <p className="text-sm text-muted-foreground">{helper}</p> : null}
    </div>
  );
}