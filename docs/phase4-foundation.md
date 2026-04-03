# Phase 4 Foundation

Phase 4 introduces a governed commercial layer on top of protected lead ownership.

## Implemented in this foundation pass

- Commission rule schema expanded to support trigger-driven fee logic
- Revenue trigger to entitlement backend function:
  - `base44/functions/createRevenueEntitlement`
- Internal finance workflow backend function:
  - `base44/functions/internalManageRevenueWorkflow`
- Partner commercial action backend function:
  - `base44/functions/partnerManageRevenueCase`
- Revenue state reconciliation backend function:
  - `base44/functions/reconcileRevenueOperations`
- New Phase 4 entity schemas:
  - `CommissionRule`
  - `RevenueEvent`
  - `RevenueEntitlement`
  - `RevenueLedger`
  - `InvoiceRecord`
  - `PayoutRecord`
  - `RevenueDispute`
  - `RevenueAdjustment`
  - `SettlementRecord`
  - `RevenueEvidence`
- Internal finance workspace:
  - `/ops/revenue`
  - `/ops/revenue/:id`
- Partner commercial visibility:
  - `/partner/payouts`
  - `/partner/disputes`
- Automatic partner milestone triggers:
  - lead accepted
  - qualified appointment booked
  - viewing completed
  - deal completed

## Supported actions

Internal:

- approve entitlement
- reject entitlement
- create invoice
- mark partial payment
- mark paid
- open dispute
- resolve dispute
- create adjustment
- create clawback
- reverse
- write off
- create settlement
- agree settlement
- mark settlement paid
- upload evidence

Partner:

- acknowledge invoice
- raise dispute
- upload payment evidence
- add commercial note
- request clarification

## Verification

Run:

```bash
npm run verify:phase4
```

## Next likely build-outs

- richer automated trigger sources from lead and deal milestones
- deeper partner invoice/dispute detail pages
- seeded finance test data
- live role QA for finance and partner accounts
- optional export and accounting integration layer
