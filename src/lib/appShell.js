export const defaultAppConfig = {
  app_name: "DubaiSphere",
  tagline: "Dubai property intelligence, verification and concierge.",
  whatsapp_number: "+971500000000",
  support_email: "hello@dubaisphere.com",
  default_city: "Dubai",
  private_inventory_label: "Private Inventory"
};

export const roleGroups = {
  buyer: ["buyer"],
  partner: ["partner_admin", "partner_broker"],
  internal: ["admin", "ops", "concierge", "compliance", "finance", "content"]
};

export const navItems = {
  buyer: [
    { label: "Explore", path: "/" },
    { label: "Shortlist", path: "/shortlist" },
    { label: "Compare", path: "/compare" },
    { label: "Guides", path: "/guides" },
    { label: "Account", path: "/account" },
    { label: "Notifications", path: "/notifications" }
  ],
  partner: [
    { label: "Overview", path: "/partner" },
    { label: "Leads", path: "/partner/leads" },
    { label: "Listings", path: "/partner/listings" },
    { label: "Concierge", path: "/partner/concierge" },
    { label: "Payouts", path: "/partner/payouts" },
    { label: "Disputes", path: "/partner/disputes" }
  ],
  internal: [
    {
      label: "Workspace",
      path: "/ops",
      section: "Daily work",
      description: "Start here. See what needs action first."
    },
    {
      label: "Buyer pipeline",
      path: "/ops/leads",
      section: "Daily work",
      description: "Qualify, protect, assign, and progress buyers."
    },
    {
      label: "Supply review",
      path: "/ops/listings",
      section: "Daily work",
      description: "Control listing trust, freshness, and publication."
    },
    {
      label: "Premium cases",
      path: "/ops/concierge",
      section: "Daily work",
      description: "Run private, HNW, and concierge journeys."
    },
    {
      label: "Money desk",
      path: "/ops/revenue",
      section: "Daily work",
      description: "Track fee claims, invoices, payments, and disputes."
    },
    {
      label: "Verification",
      path: "/ops/compliance",
      section: "Risk and quality",
      description: "Resolve permits, evidence, and publishing issues."
    },
    {
      label: "Audit log",
      path: "/ops/audit",
      section: "Risk and quality",
      description: "Review the activity trail across the platform."
    },
    {
      label: "Control center",
      path: "/ops/admin",
      section: "System control",
      description: "Rules, roles, security, team access, and setup."
    }
  ]
};

export const trustTone = (score = 0) => {
  if (score >= 85) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  return "Needs review";
};
