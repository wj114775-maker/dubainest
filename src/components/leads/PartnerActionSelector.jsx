import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const actionGroups = [
  {
    label: "Assignment",
    items: [
      { value: "accept", label: "Accept assignment" },
      { value: "reject", label: "Reject assignment" },
      { value: "request_reassignment", label: "Request reassignment" }
    ]
  },
  {
    label: "Contact",
    items: [
      { value: "log_contact_attempt", label: "Log contact attempt" },
      { value: "log_callback_booked", label: "Book callback" }
    ]
  },
  {
    label: "Viewing",
    items: [
      { value: "log_viewing_booked", label: "Book viewing" },
      { value: "log_viewing_completed", label: "Complete viewing" }
    ]
  },
  {
    label: "Outcome",
    items: [
      { value: "mark_won", label: "Mark won" },
      { value: "mark_lost", label: "Mark lost" },
      { value: "mark_invalid", label: "Mark invalid" }
    ]
  }
];

export const partnerActionOptions = actionGroups.flatMap((group) => group.items);

export default function PartnerActionSelector({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
      <SelectContent>
        {actionGroups.map((group) => (
          <div key={group.label}>
            <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group.label}</div>
            {group.items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}