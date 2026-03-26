import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const {
      summary,
      severity,
      category,
      listing_id,
      lead_id,
      partner_agency_id,
      assigned_reviewer_id,
      freeze_target_type,
      freeze_target_id,
      freeze_active = false
    } = payload;

    if (!summary || !severity || !category) {
      return Response.json({ error: 'summary, severity and category are required' }, { status: 400 });
    }

    const complianceCase = await base44.entities.ComplianceCase.create({
      summary,
      severity,
      category,
      listing_id,
      lead_id,
      partner_agency_id,
      assigned_reviewer_id,
      freeze_target_type,
      freeze_target_id,
      freeze_active,
      status: freeze_active ? 'frozen' : 'open'
    });

    const decision = await base44.entities.ComplianceDecision.create({
      compliance_case_id: complianceCase.id,
      decision_type: freeze_active ? 'freeze' : 'request_evidence',
      reviewer_id: user.id,
      notes: freeze_active ? 'Case created with immediate freeze.' : 'Case opened for review.',
      immutable: true
    });

    const audit = await base44.entities.AuditLog.create({
      entity_name: 'ComplianceCase',
      entity_id: complianceCase.id,
      action: 'compliance_case_created',
      actor_id: user.id,
      summary,
      immutable: true,
      scope: 'compliance',
      metadata: { severity, category, listing_id, lead_id, partner_agency_id, freeze_target_type, freeze_target_id, freeze_active }
    });

    return Response.json({ complianceCase, decision, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});