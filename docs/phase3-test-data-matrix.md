# Phase 3 Test Data Matrix

Use this matrix when preparing live QA data for Phase 3.

## Required users

| Role | Minimum setup | Why it is needed |
| --- | --- | --- |
| Internal reviewer | User with active compliance/listing management permissions | To test publication, evidence, and duplicate actions |
| Partner user | `PartnerUserProfile` linked to a real `partner_agency_id` | To test create/edit/respond/evidence/republish flows |
| Buyer user | Any user who can open buyer routes | To confirm trust signals match reviewed listing state |

## Required listing scenarios

| Scenario | Required records | Expected route |
| --- | --- | --- |
| Publish-ready listing | Listing plus valid permit, valid authority record, verified broker, fresh timestamp, no active duplicate block | `/ops/listings/:id` |
| Listing awaiting evidence | Listing with `missing_requirements` including evidence or an open `ComplianceCase` in `awaiting_evidence` | `/ops/listings/:id` and `/partner/listings` |
| Duplicate candidate pair | Two listings with matching fingerprint inputs and a `ListingDuplicateReview` candidate record | `/ops/listings/:id` |
| Suppressed or frozen listing | Listing with `publication_status` of `suppressed`, `frozen`, or `rejected` | `/ops/listings/:id` and `/partner/listings` |
| Published listing | Listing with `publication_status` of `published` and trust signals populated | `/listing/:id` |

## Supporting records

Prepare these where relevant:

- `ListingPermit` with a valid future `expiry_date`
- `ListingAuthorityRecord` with `status: valid`
- `BrokerVerification` with `status: passed`
- `ProjectVerification` with `status: passed` for project-linked listings
- `ComplianceEvidence` records in `submitted`, `accepted`, and `needs_more_info` states
- `ListingPublicationDecision` history for listings that already went through review

## Minimum QA set

If time is limited, create at least:

1. One clean publish-ready listing
2. One listing blocked by missing evidence
3. One duplicate pair
4. One already-published buyer-visible listing

That set is enough to exercise the major Phase 3 paths end to end.
