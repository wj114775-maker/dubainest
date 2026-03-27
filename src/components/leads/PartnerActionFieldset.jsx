import React from "react";
import PartnerAssignmentActionFields from "@/components/leads/PartnerAssignmentActionFields";
import PartnerContactActionFields from "@/components/leads/PartnerContactActionFields";
import PartnerViewingActionFields from "@/components/leads/PartnerViewingActionFields";
import PartnerOutcomeActionFields from "@/components/leads/PartnerOutcomeActionFields";

export default function PartnerActionFieldset({ form, setForm }) {
  if (["accept", "reject", "request_reassignment"].includes(form.action)) {
    return <PartnerAssignmentActionFields form={form} setForm={setForm} />;
  }

  if (["log_contact_attempt", "log_callback_booked"].includes(form.action)) {
    return <PartnerContactActionFields form={form} setForm={setForm} />;
  }

  if (["log_viewing_booked", "log_viewing_completed"].includes(form.action)) {
    return <PartnerViewingActionFields form={form} setForm={setForm} />;
  }

  return <PartnerOutcomeActionFields form={form} setForm={setForm} />;
}