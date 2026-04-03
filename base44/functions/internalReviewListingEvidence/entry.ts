import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function hasPermission(user, assignments, requiredPermissions = []) {
  if (user?.role === 'admin') return true;
  const granted = new Set(assignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]));
  return requiredPermissions.some((permission) => granted.has(permission));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await base44.entities.UserRoleAssignment.filter({ user_id: user.id, status: 'active' });
    const activeAssignments = assignments.filter((assignment) => !assignment.end_date || new Date(assignment.end_date) >= new Date());
    if (!hasPermission(user, activeAssignments, ['compliance_cases.manage', 'compliance_rules.manage'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { evidence_id, decision, reason = '' } = await req.json();
    if (!evidence_id || !decision || !reason.trim()) {
      return Response.json({ error: 'evidence_id, decision and reason are required' }, { status: 400 });
    }

    const statusMap = {
      accept: 'accepted',
      reject: 'rejected',
      needs_more_info: 'needs_more_info'
    };
    const evidenceStatus = statusMap[decision];
    if (!evidenceStatus) {
      return Response.json({ error: 'Unsupported decision' }, { status: 400 });
    }

    const evidence = await base44.asServiceRole.entities.ComplianceEvidence.get(evidence_id);
    if (!evidence) {
      return Response.json({ error: 'Evidence not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updatedEvidence = await base44.asServiceRole.entities.ComplianceEvidence.update(evidence_id, {
      status: evidenceStatus,
      reviewed_by: user.id,
      reviewed_at: now,
      notes: [evidence.notes, `Review: ${reason}`].filter(Boolean).join(' | ')
    });

    const evidenceCases = evidence.compliance_case_id
      ? [await base44.asServiceRole.entities.ComplianceCase.get(evidence.compliance_case_id)].filter(Boolean)
      : await base44.asServiceRole.entities.ComplianceCase.filter({ listing_id: evidence.listing_id });

    const updatedCases = await Promise.all(
      evidenceCases.map((item) =>
        base44.asServiceRole.entities.ComplianceCase.update(item.id, evidenceStatus === 'accepted'
          ? {
              status: 'resolved',
              resolution_notes: reason,
              resolved_at: now,
              freeze_active: false
            }
          : {
              status: 'awaiting_evidence',
              resolution_notes: reason
            })
      )
    );

    const audit = await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'Listing',
      entity_id: evidence.listing_id,
      action: 'listing_evidence_reviewed',
      actor_id: user.id,
      actor_user_id: user.id,
      summary: `${decision} evidence for listing ${evidence.listing_id}`,
      immutable: true,
      scope: 'compliance',
      metadata: {
        evidence_id,
        decision,
        reason,
        compliance_case_ids: updatedCases.map((item) => item.id)
      }
    });

    return Response.json({ evidence: updatedEvidence, cases: updatedCases, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
