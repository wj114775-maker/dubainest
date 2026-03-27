import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assignments = await base44.entities.UserRoleAssignment.filter({ user_id: user.id, status: 'active' });
    const activeAssignments = assignments.filter((assignment) => !assignment.end_date || new Date(assignment.end_date) >= new Date());
    const permissionCodes = new Set(activeAssignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]));

    if (user.role !== 'admin' && !permissionCodes.has('users.invite') && !permissionCodes.has('assignments.manage') && !permissionCodes.has('partners.manage')) {
      return Response.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const { action, email, inviteRole, assignmentId, assignmentPayload, membershipId, membershipPayload } = await req.json();

    if (action === 'invite_user') {
      const invited = await base44.users.inviteUser(email, inviteRole || 'user');
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'user_invited',
        action: 'user_invited',
        summary: 'User invited',
        scope: 'identity',
        actor_id: user.id,
        actor_user_id: user.id,
        immutable: true,
        metadata: { email, inviteRole: inviteRole || 'user' }
      });
      return Response.json({ invited });
    }

    if (action === 'create_assignment') {
      const assignment = await base44.asServiceRole.entities.UserRoleAssignment.create(assignmentPayload);
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'assignment_created',
        action: 'assignment_created',
        summary: 'Role assignment created',
        scope: 'identity',
        actor_id: user.id,
        actor_user_id: user.id,
        target_user_id: assignmentPayload.user_id,
        entity_name: 'UserRoleAssignment',
        entity_id: assignment.id,
        immutable: true,
        metadata: assignmentPayload
      });
      return Response.json({ assignment });
    }

    if (action === 'update_assignment' && assignmentId) {
      const assignment = await base44.asServiceRole.entities.UserRoleAssignment.update(assignmentId, assignmentPayload);
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'assignment_updated',
        action: 'assignment_updated',
        summary: 'Role assignment updated',
        scope: 'identity',
        actor_id: user.id,
        actor_user_id: user.id,
        target_user_id: assignment.user_id,
        entity_name: 'UserRoleAssignment',
        entity_id: assignment.id,
        immutable: true,
        metadata: assignmentPayload
      });
      return Response.json({ assignment });
    }

    if (action === 'create_membership') {
      const membership = await base44.asServiceRole.entities.OrganisationMembership.create(membershipPayload);
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'membership_created',
        action: 'membership_created',
        summary: 'Organisation membership created',
        scope: 'identity',
        actor_id: user.id,
        actor_user_id: user.id,
        target_user_id: membershipPayload.user_id,
        entity_name: 'OrganisationMembership',
        entity_id: membership.id,
        immutable: true,
        metadata: membershipPayload
      });
      return Response.json({ membership });
    }

    if (action === 'update_membership' && membershipId) {
      const membership = await base44.asServiceRole.entities.OrganisationMembership.update(membershipId, membershipPayload);
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'membership_updated',
        action: 'membership_updated',
        summary: 'Organisation membership updated',
        scope: 'identity',
        actor_id: user.id,
        actor_user_id: user.id,
        target_user_id: membership.user_id,
        entity_name: 'OrganisationMembership',
        entity_id: membership.id,
        immutable: true,
        metadata: membershipPayload
      });
      return Response.json({ membership });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});