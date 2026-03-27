import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LeadFilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Input placeholder="Search lead code or source" value={filters.search} onChange={(e) => update("search", e.target.value)} />
      <Select value={filters.stage} onValueChange={(value) => update("stage", value)}>
        <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="assigned">Assigned</SelectItem>
          <SelectItem value="accepted">Accepted</SelectItem>
          <SelectItem value="won">Won</SelectItem>
          <SelectItem value="lost">Lost</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.ownership} onValueChange={(value) => update("ownership", value)}>
        <SelectTrigger><SelectValue placeholder="Ownership" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All ownership</SelectItem>
          <SelectItem value="unowned">Unowned</SelectItem>
          <SelectItem value="soft_owned">Soft owned</SelectItem>
          <SelectItem value="locked">Locked</SelectItem>
          <SelectItem value="protected">Protected</SelectItem>
          <SelectItem value="released">Released</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.priority} onValueChange={(value) => update("priority", value)}>
        <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priority</SelectItem>
          <SelectItem value="standard">Standard</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="hnw">HNW</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}