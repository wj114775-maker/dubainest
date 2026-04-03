import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RevenueFilters({ filters, onChange, partners = [], triggers = [], rules = [] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <Input placeholder="Search partner, lead, note, or rule" value={filters.search} onChange={(event) => onChange("search", event.target.value)} />
      <Select value={filters.status} onValueChange={(value) => onChange("status", value)}>
        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending_review">Pending review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="invoiced">Invoiced</SelectItem>
          <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
          <SelectItem value="partially_paid">Partially paid</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
          <SelectItem value="disputed">Disputed</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="adjusted">Adjusted</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filters.partner} onValueChange={(value) => onChange("partner", value)}>
        <SelectTrigger><SelectValue placeholder="Partner" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All partners</SelectItem>
          {partners.map((partnerId) => <SelectItem key={partnerId} value={partnerId}>{partnerId}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.trigger} onValueChange={(value) => onChange("trigger", value)}>
        <SelectTrigger><SelectValue placeholder="Trigger" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All triggers</SelectItem>
          {triggers.map((trigger) => <SelectItem key={trigger} value={trigger}>{trigger}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.rule} onValueChange={(value) => onChange("rule", value)}>
        <SelectTrigger><SelectValue placeholder="Rule" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All rules</SelectItem>
          {rules.map((rule) => <SelectItem key={rule} value={rule}>{rule}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.special} onValueChange={(value) => onChange("special", value)}>
        <SelectTrigger><SelectValue placeholder="Special" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All cases</SelectItem>
          <SelectItem value="private_inventory">Private inventory</SelectItem>
          <SelectItem value="high_value">High value</SelectItem>
          <SelectItem value="concierge">Concierge</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
