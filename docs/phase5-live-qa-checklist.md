## Phase 5 Live QA Checklist

Run this after publishing the new Base44 entities and functions.

### Buyer trigger checks

- Submit `request_concierge` from the buyer intent sheet and verify a `ConciergeCase` is created
- Submit `request_private_inventory` and verify:
  - case is created or upgraded
  - `NDATracking` exists
  - `PrivateInventoryRequest` exists
- Submit `golden_visa` and verify the case opens with Golden Visa flags
- Submit a very high budget buyer intent and verify HNW routing logic upgrades the case

### Internal concierge checks

- Open `/ops/concierge` and confirm metrics, filters, and queues load
- Create a manual concierge case from the internal workspace
- Open `/ops/concierge/:id` and verify tabs populate:
  - Overview
  - Buyer Profile
  - Preferences
  - Participants
  - Milestones
  - Tasks
  - Inventory Requests
  - Viewings
  - Service Referrals
  - Documents
  - Notes
  - Timeline
  - Audit
- Verify internal actions:
  - assign concierge
  - change priority
  - update status
  - add milestone
  - add task
  - upload document
  - send NDA
  - mark NDA received
  - request private inventory
  - create viewing plan
  - add viewing stop
  - add service referral
  - add participant
  - add note
  - update preferences
  - escalate case
  - close case
- Run SLA reconciliation and confirm at-risk or breached cases get updated

### Partner checks

- Open `/partner/concierge` with a partner-linked user
- Confirm only partner-linked cases are visible
- Add a partner note to a case
- Upload a partner document
- Accept a service referral
- Complete a service referral
- Update a viewing stop to `confirmed`, `rescheduled`, and `cancelled`

### Notification and audit checks

- Confirm new concierge notifications open the correct route
- Confirm `ClientJourneyEvent` records are written for major actions
- Confirm `AuditLog` entries are written for case creation and internal or partner actions

### Restricted handling checks

- Confirm HNW and private inventory cases show restricted indicators
- Confirm partner users do not see internal-only notes or documents
- Confirm NDA-sensitive flows do not bypass the case container
