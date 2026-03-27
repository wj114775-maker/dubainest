import React from "react";
import { Textarea } from "@/components/ui/textarea";

export default function PartnerAssignmentActionFields({ form, setForm }) {
  if (form.action === "accept") {
    return (
      <div className="rounded-2xl border border-white/10 bg-muted/20 p-3 text-sm text-muted-foreground">
        Accepting this assignment will confirm ownership and move the lead into active handling.
      </div>
    );
  }

  const placeholder = form.action === "reject" ? "Why are you rejecting this assignment?" : "Why does this lead need reassignment?";

  return <Textarea placeholder={placeholder} value={form.notes} onChange={(e) => setForm((current) => ({ ...current, notes: e.target.value }))} />;
}