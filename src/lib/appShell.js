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
  internal: ["admin", "ops", "compliance", "finance", "content"]
};

export const navItems = {
  buyer: [
    { label: "Explore", path: "/" },
    { label: "Shortlist", path: "/shortlist" },
    { label: "Compare", path: "/compare" },
    { label: "Guides", path: "/guides" },
    { label: "Account", path: "/account" }
  ],
  partner: [
    { label: "Overview", path: "/partner" },
    { label: "Leads", path: "/partner/leads" },
    { label: "Listings", path: "/partner/listings" },
    { label: "Payouts", path: "/partner/payouts" },
    { label: "Disputes", path: "/partner/disputes" }
  ],
  internal: [
    { label: "Dashboard", path: "/ops" },
    { label: "Leads", path: "/ops/leads" },
    { label: "Admin", path: "/ops/admin" },
    { label: "Users", path: "/ops/users" },
    { label: "Compliance", path: "/ops/compliance" },
    { label: "Revenue", path: "/ops/revenue" },
    { label: "Audit", path: "/ops/audit" },
    { label: "Settings", path: "/ops/settings" }
  ]
};

export const trustTone = (score = 0) => {
  if (score >= 85) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  return "Needs review";
};