# Phase 4 Live QA Checklist

Use real authenticated finance, ops, and partner accounts.

## Internal finance

Routes:

- `/ops/commission-rules`
- `/ops/revenue`
- `/ops/revenue/:id`

Verify:

- A commission rule can be created with the new trigger and fee model fields.
- A manual revenue trigger creates:
  - `RevenueEvent`
  - `RevenueEntitlement`
  - `RevenueLedger` accrual entry
- An entitlement can be approved, invoiced, partially paid, fully paid, disputed, adjusted, clawed back, reversed, written off, and settled.
- Each workflow step writes audit history and updates invoice/payout/entitlement state consistently.
- Reconcile action marks invoices and payouts overdue when dates are breached.

## Partner workflow triggers

Routes:

- `/partner/leads`

Verify:

- Accepting a lead can create a `lead_accepted` revenue trigger when a matching rule exists.
- Booking a callback can create a `qualified_appointment_booked` trigger when a matching rule exists.
- Completing a viewing can create a `viewing_completed` trigger when a matching rule exists.
- Marking a lead won can create a `deal_completed` trigger when a matching rule exists.
- Repeating the same trigger action does not create duplicate revenue events of the same trigger type for the same lead.

## Partner commercial visibility

Routes:

- `/partner/payouts`
- `/partner/disputes`

Verify:

- Partner can see pending entitlements, invoices, payments, and settlement state.
- Partner can acknowledge invoices.
- Partner can upload payment proof.
- Partner can raise a commercial dispute.
- Partner can add commercial notes and request clarification.

## Notifications

Routes:

- `/notifications`

Verify:

- Revenue-related notifications route internal users to `/ops/revenue`.
- Revenue-related notifications route partners to `/partner/payouts`.

## Repo checks

Run:

```powershell
npm run verify:phase4
```

Expected:

- `lint` passes
- `typecheck` passes
- `build` passes
