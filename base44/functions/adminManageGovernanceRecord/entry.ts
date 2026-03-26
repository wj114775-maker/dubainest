import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { entityName, action, recordId, payload, summary, scope } = await req.json();
    const allowed = ['ComplianceRule', 'CommissionRule', 'LeadProtectionRule', 'Payout', 'ComplianceCase'];

    if (!allowed.includes(entityName) || !action) {
      return Response.json({ error: 'Invalid entity or action' }, { status: 400 });
    }

    let record;
    if (action === 'create') {
      record = await base44.asServiceRole.entities[entityName].create(payload);
    } else if (action === 'update' && recordId) {
      record = await base44.asServiceRole.entities[entityName].update(recordId, payload);
    } else {
      return Response.json({ error: 'Invalid action or record id' }, { status: 400 });
    }

    await base44.asServiceRole.entities.AuditLog.create({
      event_type: `${entityName}_${action}`,
      action: `${entityName}_${action}`,
      summary: summary || `${entityName} ${action}d`,
      scope: scope || 'settings',
      actor_id: user.id,
      actor_user_id: user.id,
      entity_name: entityName,
      entity_id: record.id,
      immutable: true,
      metadata: payload
    });

    return Response.json({ record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});