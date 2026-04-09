import { Briefcase, Building2, FileText, FolderKanban, Gem, Handshake, LayoutDashboard, ShieldCheck, WalletCards } from "lucide-react";

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
  developer: ["developer_admin", "developer_staff"],
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
  developer: [
    {
      label: "Overview",
      path: "/developer",
      section: "Developer Portal",
      description: "See projects, listings, deals, and pending actions.",
      icon: LayoutDashboard
    },
    {
      label: "Projects",
      path: "/developer/projects",
      section: "Developer Portal",
      description: "Create and manage operational project records.",
      icon: FolderKanban
    },
    {
      label: "Listings",
      path: "/developer/listings",
      section: "Developer Portal",
      description: "Draft new listings and submit governed updates.",
      icon: Building2
    },
    {
      label: "Deals",
      path: "/developer/deals",
      section: "Developer Portal",
      description: "Track reservation, contract, payment, and handover progress.",
      icon: Handshake
    },
    {
      label: "Documents",
      path: "/developer/documents",
      section: "Developer Portal",
      description: "Upload and review agreements and deal documents.",
      icon: FileText
    },
    {
      label: "Account",
      path: "/developer/account",
      section: "Developer Portal",
      description: "Review organisation access and workspace rights.",
      icon: ShieldCheck
    }
  ],
  internal: [
    {
      label: "Dashboard",
      path: "/ops",
      section: "Back Office",
      description: "Start here. See what needs action first.",
      icon: LayoutDashboard
    },
    {
      label: "Buyers",
      path: "/ops/leads",
      section: "Back Office",
      description: "Qualify, protect, assign, and progress buyers.",
      icon: Briefcase
    },
    {
      label: "Listings",
      path: "/ops/listings",
      section: "Core Tables",
      description: "Add and edit the listings table.",
      icon: Building2
    },
    {
      label: "Deals",
      path: "/ops/deals",
      section: "Core Tables",
      description: "Progress reservations, SPA, payments, and handover.",
      icon: Handshake
    },
    {
      label: "Projects",
      path: "/ops/projects",
      section: "Core Tables",
      description: "Add and edit the projects table.",
      icon: Gem
    },
    {
      label: "Developers",
      path: "/ops/developers",
      section: "Core Tables",
      description: "Add and edit the developers table.",
      icon: Briefcase
    },
    {
      label: "Money",
      path: "/ops/revenue",
      section: "Back Office",
      description: "Track fee claims, invoices, payments, and disputes.",
      icon: WalletCards
    },
    {
      label: "Settings",
      path: "/ops/admin",
      section: "Setup",
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
