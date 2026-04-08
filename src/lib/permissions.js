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
    "revenue.read",
    "revenue.approve",
    "revenue.adjust",
    "revenue.reverse",
    "revenue.writeoff",
    "revenue.dispute.manage",
    "commission_rules.read",
    "commission_rules.manage",
    "invoice.create",
    "invoice.read",
    "invoice.manage",
    "payment.read",
    "payment.manage",
    "settlement.manage",
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
    "leads.read",
    "concierge_cases.read",
    "concierge_cases.create",
    "concierge_cases.manage",
    "concierge_tasks.manage",
    "concierge_documents.manage",
    "private_inventory.manage",
    "nda.manage",
    "viewing_plans.manage",
    "service_referrals.manage",
    "hnw_cases.read",
    "hnw_cases.manage",
    "private_documents.read",
    "private_documents.manage"
  ],
  partnerAdminAccess: [
    "partners.read",
    "listings.read",
    "leads.read",
    "partner_case.read",
    "partner_case.update_limited",
    "partner_viewings.manage_limited",
    "partner_documents.upload_limited",
    "partner_revenue.read",
    "partner_invoice.read",
    "partner_dispute.create",
    "partner_payment_evidence.upload"
  ],
  partnerBrokerAccess: [
    "listings.read",
    "leads.read",
    "partner_case.read",
    "partner_case.update_limited",
    "partner_viewings.manage_limited",
    "partner_documents.upload_limited",
    "partner_revenue.read",
    "partner_invoice.read",
    "partner_dispute.create",
    "partner_payment_evidence.upload"
  ],
  developerAdminAccess: [
    "developer_portal.access",
    "developer_projects.manage",
    "developer_listings.manage",
    "developer_deals.read",
    "developer_deals.manage",
    "developer_documents.upload",
    "developer_documents.read",
    "developer_account.manage"
  ],
  developerStaffAccess: [
    "developer_portal.access",
    "developer_projects.manage",
    "developer_listings.manage",
    "developer_deals.read",
    "developer_documents.upload",
    "developer_documents.read"
  ]
};

export const legacyRolePermissions = {
  admin: [...permissionBundles.adminCore, ...permissionBundles.partnerGovernance, ...permissionBundles.complianceGovernance, ...permissionBundles.revenueGovernance, ...permissionBundles.conciergeAccess],
  ops: ["users.read", "users.update", "partners.read", "partners.manage", "assignments.read", "audit.read", "settings.read", ...permissionBundles.conciergeAccess],
  concierge: [...permissionBundles.conciergeAccess],
  compliance: [...permissionBundles.complianceGovernance],
  finance: [...permissionBundles.revenueGovernance],
  content: [...permissionBundles.contentGovernance],
  partner_admin: [...permissionBundles.partnerAdminAccess],
  partner_broker: [...permissionBundles.partnerBrokerAccess],
  developer_admin: [...permissionBundles.developerAdminAccess],
  developer_staff: [...permissionBundles.developerStaffAccess],
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
