export const defaultPartnerActionForm = {
  action: "accept",
  notes: "",
  outcome: "",
  scheduled_at: "",
};

export const partnerActionRequirements = {
  accept: { notes: false, outcome: false, scheduled_at: false },
  reject: { notes: true, outcome: false, scheduled_at: false },
  request_reassignment: { notes: true, outcome: false, scheduled_at: false },
  log_contact_attempt: { notes: true, outcome: true, scheduled_at: false },
  log_callback_booked: { notes: true, outcome: false, scheduled_at: true },
  log_viewing_booked: { notes: true, outcome: false, scheduled_at: true },
  log_viewing_completed: { notes: true, outcome: true, scheduled_at: true },
  mark_won: { notes: true, outcome: false, scheduled_at: false },
  mark_lost: { notes: true, outcome: true, scheduled_at: false },
  mark_invalid: { notes: true, outcome: true, scheduled_at: false },
};

export function createPartnerActionForm(action) {
  if (action === "log_contact_attempt") {
    return { action, notes: "", outcome: "call", scheduled_at: "" };
  }

  return { ...defaultPartnerActionForm, action };
}