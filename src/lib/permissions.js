export const permissionBundles = {
  adminCore: [
    "users.read",
    "users.manage",
    "roles.read",
    "roles.manage",
    "security.manage",
    "audit.read",
    "settings.manage"
  ],
  partnerGovernance: [
    "partners.read",
    "partners.manage",
    "lead_rules.read",
    "lead_rules.manage",
    "commission_rules.read",
    "commission_rules.manage"
  ],
  complianceGovernance: [
    "compliance_cases.read",
    "compliance_cases.manage",
    "compliance_rules.read",
    "compliance_rules.manage"
  ]
};

export const legacyRolePermissions = {
  admin: [...permissionBundles.adminCore, ...permissionBundles.partnerGovernance, ...permissionBundles.complianceGovernance],
  ops: ["users.read", "partners.read", "lead_rules.read", "commission_rules.read", "audit.read"],
  compliance: ["compliance_cases.read", "compliance_cases.manage", "compliance_rules.read", "audit.read"],
  finance: ["commission_rules.read", "commission_rules.manage", "audit.read"],
  content: ["settings.manage"],
  partner_admin: ["partners.read"],
  partner_broker: [],
  buyer: []
};

export function getPermissionSet(userRoleAssignments = [], role = "buyer") {
  const derived = new Set(legacyRolePermissions[role] || []);
  userRoleAssignments.forEach((assignment) => {
    (assignment.permission_codes || []).forEach((permission) => derived.add(permission));
    (assignment.bundle_codes || []).forEach((bundleCode) => {
      (permissionBundles[bundleCode] || []).forEach((permission) => derived.add(permission));
    });
  });
  return Array.from(derived);
}

export function hasPermission(permissionSet = [], permission) {
  return permissionSet.includes(permission);
}