import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buyerPipelineStages } from "@/lib/buyerPipeline";

export default function LeadFilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      <Input placeholder="Search lead code or source" value={filters.search} onChange={(e) => update("search", e.target.value)} />
      <Select value={filters.stage} onValueChange={(value) => update("stage", value)}>
        <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All stages</SelectItem>
          {buyerPipelineStages.map((stage) => (
            <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
          ))}
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
      <Select value={filters.source} onValueChange={(value) => update("source", value)}>
        <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All sources</SelectItem>
          <SelectItem value="organic">Organic</SelectItem>
          <SelectItem value="enquiry">Enquiry</SelectItem>
          <SelectItem value="callback">Callback</SelectItem>
          <SelectItem value="concierge">Concierge</SelectItem>
          <SelectItem value="private_inventory">Private inventory</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.duplicate} onValueChange={(value) => update("duplicate", value)}>
        <SelectTrigger><SelectValue placeholder="Duplicate" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All duplicate states</SelectItem>
          <SelectItem value="true">Duplicate only</SelectItem>
          <SelectItem value="false">Non-duplicate</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.sla} onValueChange={(value) => update("sla", value)}>
        <SelectTrigger><SelectValue placeholder="SLA" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All SLA</SelectItem>
          <SelectItem value="on_track">On track</SelectItem>
          <SelectItem value="at_risk">At risk</SelectItem>
          <SelectItem value="breached">Breached</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
