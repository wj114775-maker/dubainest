import { Briefcase, Building2, Gem, LayoutDashboard, ShieldCheck, WalletCards } from "lucide-react";

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
    { label: "Properties", path: "/properties" },
    { label: "Projects", path: "/projects" },
    { label: "Developers", path: "/developers" },
    { label: "Guides", path: "/guides" },
    { label: "Account", path: "/account" }
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
      label: "Home",
      path: "/ops",
      section: "Operations",
      description: "Start here. See what needs action first.",
      icon: LayoutDashboard
    },
    {
      label: "Buyers",
      path: "/ops/leads",
      section: "Operations",
      description: "Qualify, protect, assign, and progress buyers.",
      icon: Briefcase
    },
    {
      label: "Listings",
      path: "/ops/listings",
      section: "Operations",
      description: "Control listing trust, freshness, and publication.",
      icon: Building2
    },
    {
      label: "Premium",
      path: "/ops/concierge",
      section: "Operations",
      description: "Run private, HNW, and concierge journeys.",
      icon: Gem
    },
    {
      label: "Money",
      path: "/ops/revenue",
      section: "Operations",
      description: "Track fee claims, invoices, payments, and disputes.",
      icon: WalletCards
    },
    {
      label: "Control center",
      path: "/ops/admin",
      section: "Admin",
      description: "Rules, roles, security, team access, and setup.",
      icon: ShieldCheck
    }
  ]
};

export const trustTone = (score = 0) => {
  if (score >= 85) return "Exceptional";
  if (score >= 70) return "Strong";
  if (score >= 50) return "Moderate";
  return "Needs review";
};
