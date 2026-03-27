import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const actionOptions = [
  { value: "assign", label: "Assign / reassign" },
  { value: "mark_duplicate", label: "Start duplicate review" },
  { value: "merge", label: "Merge lead" },
  { value: "lock", label: "Lock protection" },
  { value: "release", label: "Release protection" },
  { value: "flag_circumvention", label: "Open circumvention case" },
  { value: "escalate", label: "Escalate lead" }
];

export { actionOptions };

export default function InternalLeadActionSelector({ value, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Action" /></SelectTrigger>
      <SelectContent>
        {actionOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}