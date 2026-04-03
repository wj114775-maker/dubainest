import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { conciergeCaseStatusOptions, conciergeCaseTypeOptions, conciergePriorityOptions, compactLabel } from "@/lib/concierge";

export default function ConciergeFilters({ filters, onChange, owners = [] }) {
  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5">
        <Input
          placeholder="Search case, lead, buyer, or summary"
          value={filters.search}
          onChange={(event) => onChange("search", event.target.value)}
        />
        <Select value={filters.status} onValueChange={(value) => onChange("status", value)}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {conciergeCaseStatusOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.caseType} onValueChange={(value) => onChange("caseType", value)}>
          <SelectTrigger><SelectValue placeholder="Case type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All case types</SelectItem>
            {conciergeCaseTypeOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.priority} onValueChange={(value) => onChange("priority", value)}>
          <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {conciergePriorityOptions.map((option) => <SelectItem key={option} value={option}>{compactLabel(option)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.owner} onValueChange={(value) => onChange("owner", value)}>
          <SelectTrigger><SelectValue placeholder="Owner" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {owners.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
