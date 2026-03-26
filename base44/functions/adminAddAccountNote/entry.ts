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

    const { targetUserId, note, visibility, category } = await req.json();
    if (!targetUserId || !note?.trim()) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const saved = await base44.asServiceRole.entities.AccountNote.create({
      user_id: targetUserId,
      note: note.trim(),
      created_by: user.id,
      visibility: visibility || 'internal',
      category: category || 'general'
    });

    await base44.asServiceRole.entities.AuditLog.create({
      event_type: 'account_note_created',
      action: 'account_note_created',
      summary: 'Account note added',
      scope: 'identity',
      actor_id: user.id,
      actor_user_id: user.id,
      target_user_id: targetUserId,
      entity_name: 'AccountNote',
      entity_id: saved.id,
      immutable: true,
      metadata: { visibility: visibility || 'internal', category: category || 'general' }
    });

    return Response.json({ note: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});