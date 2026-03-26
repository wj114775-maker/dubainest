import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { compliance_case_id, decision_type, notes = '' } = payload;

    if (!compliance_case_id || !decision_type) {
      return Response.json({ error: 'compliance_case_id and decision_type are required' }, { status: 400 });
    }

    const complianceCase = await base44.entities.ComplianceCase.get(compliance_case_id);
    if (!complianceCase) {
      return Response.json({ error: 'Compliance case not found' }, { status: 404 });
    }
    const statusMap = {
      freeze: 'frozen',
      unfreeze: 'under_review',
      request_evidence: 'awaiting_evidence',
      approve: 'approved',
      reject: 'rejected',
      escalate: 'under_review',
      close: 'closed'
    };

    const updatedCase = await base44.entities.ComplianceCase.update(compliance_case_id, {
      status: statusMap[decision_type] || complianceCase.status,
      freeze_active: decision_type === 'freeze' ? true : decision_type === 'unfreeze' ? false : complianceCase.freeze_active
    });

    const decision = await base44.entities.ComplianceDecision.create({
      compliance_case_id,
      decision_type,
      reviewer_id: user.id,
      notes,
      immutable: true
    });

    const audit = await base44.entities.AuditLog.create({
      entity_name: 'ComplianceCase',
      entity_id: compliance_case_id,
      action: 'compliance_decision_applied',
      actor_id: user.id,
      summary: `Compliance decision applied: ${decision_type}`,
      immutable: true,
      scope: 'compliance',
      metadata: { decision_type, notes }
    });

    return Response.json({ complianceCase: updatedCase, decision, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});