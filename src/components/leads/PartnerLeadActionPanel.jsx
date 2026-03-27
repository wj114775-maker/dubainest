import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PartnerActionGuidanceCard from "@/components/leads/PartnerActionGuidanceCard";
import PartnerActionFieldset from "@/components/leads/PartnerActionFieldset";
import PartnerActionSelector, { partnerActionOptions } from "@/components/leads/PartnerActionSelector";
import { createPartnerActionForm, partnerActionRequirements } from "@/components/leads/partnerActionConfig";

export default function PartnerLeadActionPanel({ lead, assignment, loading, onSubmit }) {
  const [form, setForm] = useState(createPartnerActionForm("accept"));
  const selectedAction = useMemo(() => partnerActionOptions.find((item) => item.value === form.action), [form.action]);

  const blockedReason = (() => {
    const requirements = partnerActionRequirements[form.action] || {};
    if (["accept", "mark_won"].includes(form.action) && assignment?.assignment_status === "rejected") return "This assignment is already closed.";
    if (requirements.notes && !form.notes.trim()) return "Add the required details before submitting.";
    if (requirements.outcome && !form.outcome) return "Choose the required option first.";
    if (requirements.scheduled_at && !form.scheduled_at) return "Choose the required date and time first.";
    return "";
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Card className="rounded-[2rem] border-white/10 bg-card/80">
      <CardHeader><CardTitle>Partner action panel</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <PartnerActionSelector value={form.action} onChange={(value) => setForm(createPartnerActionForm(value))} />

          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-background/50 p-3 text-sm">
              <p className="font-medium text-foreground">{selectedAction?.label}</p>
            </div>
            <PartnerActionGuidanceCard action={form.action} />
            <PartnerActionFieldset form={form} setForm={setForm} />
          </div>

          <div className="grid gap-3 rounded-2xl border border-dashed border-white/10 p-3 text-sm text-muted-foreground md:grid-cols-2">
            <p>Status: {lead?.status || "new"}</p>
            <p>Ownership: {lead?.ownership_status || "unowned"}</p>
            <p>Assignment: {assignment?.assignment_status || "pending"}</p>
            <p>SLA: {assignment?.sla_status || "on_track"}</p>
          </div>

          {blockedReason ? <p className="text-sm text-destructive">{blockedReason}</p> : null}

          <Button type="submit" disabled={loading || Boolean(blockedReason)} className="w-full">Run action</Button>
        </form>
      </CardContent>
    </Card>
  );
}