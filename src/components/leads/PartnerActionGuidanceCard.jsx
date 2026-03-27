import React from "react";

export default function PartnerActionGuidanceCard({ action }) {
  const content = {
    accept: "Accept this assignment to lock the lead to your team and start handling.",
    reject: "Reject only when your team cannot handle the lead. Add a clear reason.",
    request_reassignment: "Use this when the lead should be routed to another partner. Explain why.",
    log_contact_attempt: "Record the contact channel and what happened on the attempt.",
    log_callback_booked: "Set the callback time so the lead moves into a scheduled follow-up state.",
    log_viewing_booked: "Set the viewing time once the client has agreed to attend.",
    log_viewing_completed: "Confirm the viewing date and summarise the outcome after it happened.",
    mark_won: "Use only after conversion is confirmed.",
    mark_lost: "Record why the opportunity was lost.",
    mark_invalid: "Use for invalid, duplicate, unreachable or non-actionable leads."
  };

  return <div className="rounded-2xl border border-white/10 bg-muted/30 p-3 text-sm text-muted-foreground">{content[action]}</div>;
}