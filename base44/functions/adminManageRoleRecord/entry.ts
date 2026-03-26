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

    const { recordType, action, recordId, payload } = await req.json();

    const entityMap = {
      role: 'Role',
      bundle: 'PermissionBundle'
    };

    const entityName = entityMap[recordType];
    if (!entityName || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;
    if (action === 'create') {
      result = await base44.asServiceRole.entities[entityName].create(payload);
    } else if (action === 'update' && recordId) {
      result = await base44.asServiceRole.entities[entityName].update(recordId, payload);
    } else {
      return Response.json({ error: 'Invalid action or record id' }, { status: 400 });
    }

    await base44.asServiceRole.entities.AuditLog.create({
      event_type: `${recordType}_${action}`,
      action: `${recordType}_${action}`,
      summary: `${recordType === 'role' ? 'Role' : 'Bundle'} ${action}d`,
      scope: 'settings',
      actor_id: user.id,
      actor_user_id: user.id,
      entity_name: entityName,
      entity_id: result.id,
      immutable: true,
      metadata: payload
    });

    return Response.json({ record: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});