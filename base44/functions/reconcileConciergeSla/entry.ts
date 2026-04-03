import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

function hasPermission(user, assignments, requiredPermissions = []) {
  if (user?.role === 'admin') return true;
  const granted = new Set(assignments.flatMap((assignment) => [...(assignment.permission_codes || []), ...(assignment.bundle_codes || [])]));
  return requiredPermissions.some((permission) => granted.has(permission));
}

function isOpenCase(caseRecord) {
  return !['closed_won', 'closed_lost', 'archived'].includes(caseRecord.case_status || '');
}

function isOpenTask(task) {
  return !['completed', 'cancelled'].includes(task.status || '');
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
    if (!hasPermission(user, activeAssignments, ['concierge_cases.manage', 'concierge_tasks.manage'])) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [cases, tasks, ndaRecords] = await Promise.all([
      base44.asServiceRole.entities.ConciergeCase.list('-updated_date', 200),
      base44.asServiceRole.entities.ConciergeTask.list('-updated_date', 500),
      base44.asServiceRole.entities.NDATracking.list('-updated_date', 200)
    ]);

    const now = new Date();
    const updatedCases = [];
    const breached = [];
    const atRisk = [];

    for (const caseRecord of cases.filter(isOpenCase)) {
      const caseTasks = tasks
        .filter((task) => task.case_id === caseRecord.id && isOpenTask(task) && task.due_date)
        .sort((left, right) => new Date(left.due_date).getTime() - new Date(right.due_date).getTime());
      const nda = ndaRecords.find((item) => item.case_id === caseRecord.id && ['pending', 'sent'].includes(item.nda_status));
      const candidates = [
        caseTasks[0]?.due_date || '',
        nda?.sent_at ? new Date(new Date(nda.sent_at).getTime() + 48 * 60 * 60 * 1000).toISOString() : ''
      ].filter(Boolean);

      const nextSlaDueAt = candidates.sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0] || caseRecord.next_sla_due_at || '';
      let nextStatus = 'on_track';
      if (nextSlaDueAt) {
        const due = new Date(nextSlaDueAt);
        const deltaHours = (due.getTime() - now.getTime()) / (60 * 60 * 1000);
        if (deltaHours < 0) nextStatus = 'breached';
        else if (deltaHours <= 24) nextStatus = 'at_risk';
      }

      if (caseRecord.sla_status !== nextStatus || caseRecord.next_sla_due_at !== nextSlaDueAt) {
        const updated = await base44.asServiceRole.entities.ConciergeCase.update(caseRecord.id, {
          sla_status: nextStatus,
          next_sla_due_at: nextSlaDueAt
        });
        updatedCases.push(updated);
      }

      if (nextStatus === 'breached' && caseRecord.sla_status !== 'breached') {
        breached.push(caseRecord.id);
        await base44.asServiceRole.entities.Notification.create({
          title: 'Concierge SLA breached',
          body: `${caseRecord.case_code} needs immediate attention.`,
          concierge_case_id: caseRecord.id,
          category: 'concierge',
          route_path: `/ops/concierge/${caseRecord.id}`,
          channel: 'in_app',
          status: 'queued'
        });
      } else if (nextStatus === 'at_risk' && caseRecord.sla_status === 'on_track') {
        atRisk.push(caseRecord.id);
        await base44.asServiceRole.entities.Notification.create({
          title: 'Concierge SLA at risk',
          body: `${caseRecord.case_code} is approaching its next service deadline.`,
          concierge_case_id: caseRecord.id,
          category: 'concierge',
          route_path: `/ops/concierge/${caseRecord.id}`,
          channel: 'in_app',
          status: 'queued'
        });
      }
    }

    await base44.asServiceRole.entities.AuditLog.create({
      entity_name: 'ConciergeCase',
      entity_id: '',
      action: 'reconcile_concierge_sla',
      actor_id: user.id,
      actor_user_id: user.id,
      summary: 'Concierge SLA reconciliation completed.',
      immutable: true,
      scope: 'concierge',
      metadata: {
        updated_case_count: updatedCases.length,
        breached_case_ids: breached,
        at_risk_case_ids: atRisk
      }
    });

    return Response.json({
      updated_case_count: updatedCases.length,
      breached_case_ids: breached,
      at_risk_case_ids: atRisk
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
