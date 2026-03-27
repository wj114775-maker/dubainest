import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const lossReasons = ["budget", "timing", "location", "competitor", "not_interested", "other"];
const invalidReasons = ["duplicate", "fake", "unreachable", "out_of_scope", "other"];

export default function PartnerOutcomeActionFields({ form, setForm }) {
  if (form.action === "mark_won") {
    return <Textarea placeholder="Outcome summary, buyer confirmation, and next steps" value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />;
  }

  const options = form.action === "mark_lost" ? lossReasons : invalidReasons;
  const placeholder = form.action === "mark_lost" ? "Why was this lead lost?" : "Why is this lead invalid?";
  const selectPlaceholder = form.action === "mark_lost" ? "Loss reason" : "Invalid reason";

  return (
    <div className="space-y-3">
      <Select value={form.outcome} onValueChange={(value) => setForm((current) => ({ ...current, outcome: value }))}>
        <SelectTrigger><SelectValue placeholder={selectPlaceholder} /></SelectTrigger>
        <SelectContent>{options.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}</SelectContent>
      </Select>
      <Textarea placeholder={placeholder} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />
    </div>
  );
}