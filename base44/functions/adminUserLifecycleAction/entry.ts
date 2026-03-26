import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const actionConfig = {
  suspend: {
    summary: 'User suspended',
    scope: 'security',
    patch: {
      is_suspended: true,
      is_locked: false,
      password_reset_required: false,
      mfa_reset_required: false,
      security_status: 'suspended'
    }
  },
  unsuspend: {
    summary: 'User unsuspended',
    scope: 'security',
    patch: {
      is_suspended: false,
      security_status: 'normal'
    }
  },
  password_reset: {
    summary: 'Password reset required',
    scope: 'security',
    patch: {
      password_reset_required: true,
      security_status: 'password_reset_required'
    }
  },
  mfa_reset: {
    summary: 'MFA reset required',
    scope: 'security',
    patch: {
      mfa_reset_required: true,
      security_status: 'mfa_reset_required'
    }
  },
  unlock: {
    summary: 'User unlocked',
    scope: 'security',
    patch: {
      is_locked: false,
      security_status: 'normal'
    }
  }
};

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

    const body = await req.json();
    const { targetUserId, action, reason } = body;
    const config = actionConfig[action];

    if (!targetUserId || !config || !reason?.trim()) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingStates = await base44.asServiceRole.entities.UserSecurityState.filter({ user_id: targetUserId });
    const existing = existingStates[0] || null;
    const nextState = {
      ...(existing || { user_id: targetUserId }),
      ...config.patch,
      last_security_action_at: new Date().toISOString(),
      last_security_action_by: user.email,
      security_notes: reason.trim()
    };

    let savedState;
    if (existing?.id) {
      savedState = await base44.asServiceRole.entities.UserSecurityState.update(existing.id, nextState);
    } else {
      savedState = await base44.asServiceRole.entities.UserSecurityState.create(nextState);
    }

    const audit = await base44.asServiceRole.entities.AuditLog.create({
      event_type: action,
      action,
      summary: config.summary,
      reason: reason.trim(),
      scope: config.scope,
      actor_id: user.id,
      actor_user_id: user.id,
      target_user_id: targetUserId,
      target_entity_type: 'User',
      target_entity_id: targetUserId,
      entity_name: 'UserSecurityState',
      entity_id: savedState.id,
      immutable: true,
      metadata: {
        security_status: savedState.security_status,
        is_suspended: savedState.is_suspended,
        is_locked: savedState.is_locked,
        password_reset_required: savedState.password_reset_required,
        mfa_reset_required: savedState.mfa_reset_required
      }
    });

    return Response.json({ securityState: savedState, audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});