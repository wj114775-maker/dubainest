import React from "react";

const helperText = {
  assign: "Choose a partner for first-time ownership, then add the handoff reason.",
  reassign: "Choose the next partner and explain why ownership is changing.",
  mark_duplicate: "Start duplicate review and capture why this lead needs review.",
  merge: "Choose the reviewed target lead, then confirm the merge reason.",
  lock: "Lock or extend protection for this lead.",
  renew_protection: "Renew the current protection window with a reason.",
  request_override: "Request an approved override before releasing a protected lead.",
  release: "Release protection and record why it is safe to do so.",
  flag_circumvention: "Open a circumvention case with severity and evidence.",
  escalate: "Escalate this lead for urgent internal handling."
};

export default function InternalLeadWorkflowHint({ action, title }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-muted/30 p-3 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1">{helperText[action]}</p>
    </div>
  );
}