export const permissionBundles = {
  adminCore: [
    "users.read",
    "users.create",
    "users.update",
    "users.suspend",
    "users.archive",
    "users.verify",
    "users.invite",
    "users.security_actions",
    "roles.read",
    "roles.manage",
    "permissions.read",
    "permissions.manage",
    "assignments.read",
    "assignments.manage",
    "security.force_logout",
    "security.password_reset",
    "security.mfa_reset",
    "security.unlock",
    "security.session_view",
    "audit.read",
    "audit.export",
    "settings.read",
    "settings.manage"
  ],
  partnerGovernance: [
    "partners.read",
    "partners.manage",
    "partners.access_control",
    "users.read",
    "assignments.read",
    "assignments.manage",
    "audit.read"
  ],
  complianceGovernance: [
    "compliance_cases.read",
    "compliance_cases.manage",
    "compliance_rules.read",
    "compliance_rules.manage",
    "audit.read"
  ],
  revenueGovernance: [
    "commission_rules.read",
    "commission_rules.manage",
    "payouts.read",
    "payouts.manage",
    "audit.read"
  ],
  contentGovernance: [
    "settings.read",
    "settings.manage"
  ],
  supportAccess: [
    "users.read",
    "users.update",
    "users.invite",
    "assignments.read",
    "audit.read"
  ],
  conciergeAccess: [
    "users.read",
    "leads.read"
  ],
  partnerAdminAccess: [
    "partners.read",
    "listings.read",
    "leads.read"
  ],
  partnerBrokerAccess: [
    "listings.read",
    "leads.read"
  ]
};

export const legacyRolePermissions = {
  admin: [...permissionBundles.adminCore, ...permissionBundles.partnerGovernance, ...permissionBundles.complianceGovernance, ...permissionBundles.revenueGovernance],
  ops: ["users.read", "users.update", "partners.read", "partners.manage", "assignments.read", "audit.read", "settings.read"],
  compliance: [...permissionBundles.complianceGovernance],
  finance: [...permissionBundles.revenueGovernance],
  content: [...permissionBundles.contentGovernance],
  partner_admin: [...permissionBundles.partnerAdminAccess],
  partner_broker: [...permissionBundles.partnerBrokerAccess],
  buyer: []
};

export function expandBundleCodes(bundleCodes = []) {
  const derived = new Set();
  bundleCodes.forEach((bundleCode) => {
    (permissionBundles[bundleCode] || []).forEach((permission) => derived.add(permission));
  });
  return Array.from(derived);
}

export function getPermissionSet(userRoleAssignments = [], role = "buyer") {
  const derived = new Set(legacyRolePermissions[role] || []);
  userRoleAssignments.forEach((assignment) => {
    (assignment.permission_codes || []).forEach((permission) => derived.add(permission));
    expandBundleCodes(assignment.bundle_codes || []).forEach((permission) => derived.add(permission));
  });
  return Array.from(derived);
}

export function hasPermission(permissionSet = [], permission) {
  return permissionSet.includes(permission);
}