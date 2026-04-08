import { base44 } from "@/api/base44Client";
import { getPermissionSet, hasPermission } from "@/lib/permissions";
import { roleGroups } from "@/lib/appShell";

const ROLE_KEYS = [
  "role",
  "_app_role",
  "app_role",
  "appRole",
  "user_role",
  "userRole",
  "collaborator_role",
  "collaboratorRole",
  "access_role",
  "accessRole",
];

const ROLE_ARRAY_KEYS = ["roles", "app_roles", "appRoles"];
const PRIVILEGED_ROLE_VALUES = new Set(["owner", "admin", "administrator", "super_admin", "superadmin", "collaborator_admin"]);
const PRIVILEGED_FLAG_KEYS = [
  "is_owner",
  "isOwner",
  "owner",
  "app_owner",
  "appOwner",
  "is_admin",
  "isAdmin",
  "admin",
  "is_collaborator_admin",
  "isCollaboratorAdmin",
];

const INTERNAL_PERMISSION_HINTS = [
  "settings.read",
  "settings.manage",
  "users.read",
  "roles.read",
  "permissions.read",
  "audit.read",
  "compliance_cases.read",
  "revenue.read",
  "concierge_cases.read",
];

const PARTNER_PERMISSION_HINTS = [
  "partner_case.read",
  "partner_case.update_limited",
  "partner_viewings.manage_limited",
  "partner_documents.upload_limited",
  "partner_revenue.read",
  "partner_invoice.read",
  "partner_dispute.create",
  "partner_payment_evidence.upload",
];

const DEVELOPER_PERMISSION_HINTS = [
  "developer_portal.access",
  "developer_projects.manage",
  "developer_listings.manage",
  "developer_deals.read",
  "developer_deals.manage",
  "developer_documents.read",
  "developer_documents.upload",
  "developer_account.manage",
];

function normalizeRoleValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function mapRoleValue(value) {
  const normalized = normalizeRoleValue(value);
  if (!normalized) return "";
  if (PRIVILEGED_ROLE_VALUES.has(normalized)) return "admin";
  return normalized;
}

export function resolveAppRole(user) {
  for (const key of ROLE_KEYS) {
    const resolved = mapRoleValue(user?.[key]);
    if (resolved) return resolved;
  }

  for (const key of ROLE_ARRAY_KEYS) {
    const values = Array.isArray(user?.[key]) ? user[key] : [];
    const resolved = values.map(mapRoleValue).find(Boolean);
    if (resolved) return resolved;
  }

  return "buyer";
}

export function hasPrivilegedAppAccess(user) {
  if (!user) return false;

  if (PRIVILEGED_FLAG_KEYS.some((key) => Boolean(user?.[key]))) {
    return true;
  }

  return ROLE_KEYS.some((key) => PRIVILEGED_ROLE_VALUES.has(normalizeRoleValue(user?.[key])))
    || ROLE_ARRAY_KEYS.some((key) => {
      const values = Array.isArray(user?.[key]) ? user[key] : [];
      return values.some((value) => PRIVILEGED_ROLE_VALUES.has(normalizeRoleValue(value)));
    });
}

export async function getCurrentAccessState() {
  let user;

  try {
    user = await base44.auth.me();
  } catch {
    return {
      isAuthenticated: false,
      user: null,
      role: "buyer",
      assignments: [],
      permissions: [],
      hasFullAccess: false,
      isInternal: false,
      isPartner: false,
      can: () => false,
    };
  }

  let activeAssignments = [];
  let memberships = [];

  try {
    const assignments = await base44.entities.UserRoleAssignment.filter({ user_id: user.id, status: "active" });
    activeAssignments = assignments.filter((assignment) => !assignment.end_date || new Date(assignment.end_date) >= new Date());
  } catch {
    activeAssignments = [];
  }

  try {
    memberships = await base44.entities.OrganisationMembership.filter({ user_id: user.id });
  } catch {
    memberships = [];
  }

  const role = resolveAppRole(user);
  const permissions = getPermissionSet(activeAssignments.map((assignment) => ({
    permission_codes: assignment.permission_codes || [],
    bundle_codes: assignment.bundle_codes || [],
  })), role);
  const activeMemberships = memberships.filter((membership) => !membership.end_date || new Date(membership.end_date) >= new Date());
  const developerMemberships = activeMemberships.filter((membership) => membership.organisation_type === "developer_organisation");
  const hasFullAccess = hasPrivilegedAppAccess(user) || role === "admin";
  const isInternal = hasFullAccess
    || roleGroups.internal.includes(role)
    || INTERNAL_PERMISSION_HINTS.some((permission) => permissions.includes(permission));
  const isPartner = roleGroups.partner.includes(role)
    || PARTNER_PERMISSION_HINTS.some((permission) => permissions.includes(permission));
  const isDeveloper = roleGroups.developer.includes(role)
    || developerMemberships.length > 0
    || DEVELOPER_PERMISSION_HINTS.some((permission) => permissions.includes(permission));

  return {
    isAuthenticated: true,
    user,
    role,
    assignments: activeAssignments,
    memberships: activeMemberships,
    developerMemberships,
    permissions,
    hasFullAccess,
    isInternal,
    isPartner,
    isDeveloper,
    can: (permission) => hasFullAccess || isInternal || hasPermission(permissions, permission),
  };
}
