import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ComplianceFilters({ filters, onChange }) {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Select value={filters.severity} onValueChange={(value) => onChange("severity", value)}>
        <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All severity</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="critical">Critical</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.trustBand} onValueChange={(value) => onChange("trustBand", value)}>
        <SelectTrigger><SelectValue placeholder="Trust band" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All trust bands</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.freshness} onValueChange={(value) => onChange("freshness", value)}>
        <SelectTrigger><SelectValue placeholder="Freshness" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All freshness</SelectItem>
          <SelectItem value="fresh">Fresh</SelectItem>
          <SelectItem value="aging">Aging</SelectItem>
          <SelectItem value="stale">Stale</SelectItem>
          <SelectItem value="expired">Expired</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.permit} onValueChange={(value) => onChange("permit", value)}>
        <SelectTrigger><SelectValue placeholder="Permit" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All permits</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.partner} onValueChange={(value) => onChange("partner", value)}>
        <SelectTrigger><SelectValue placeholder="Partner" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All partners</SelectItem>
          <SelectItem value="assigned">Has partner</SelectItem>
          <SelectItem value="unassigned">No partner</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.scope} onValueChange={(value) => onChange("scope", value)}>
        <SelectTrigger><SelectValue placeholder="Scope" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All records</SelectItem>
          <SelectItem value="cases">Cases only</SelectItem>
          <SelectItem value="listings">Listings only</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}