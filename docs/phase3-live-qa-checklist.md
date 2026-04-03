# Phase 3 Live QA Checklist

Use real authenticated accounts for the roles below against the local app or the deployed Base44 app.

## Internal reviewer

Routes:
- `/ops/listings`
- `/ops/listings/:id`

Verify:
- Listing queue loads and deep-links into the listing workspace.
- Publication controls work for `publish`, `unpublish`, `freeze`, `reject`, `archive`, `request correction`, and `republish`.
- Every publication action writes a `ListingPublicationDecision` record and shows in publication history.
- Evidence review updates evidence status and moves related compliance cases appropriately.
- Duplicate review can mark primary, start review, confirm duplicate, and dismiss duplicate.
- Duplicate/evidence actions change trust/readiness after governance recalculation.
- Audit history records publication, evidence, and duplicate decisions.

## Partner user

Routes:
- `/partner/listings`

Verify:
- Create listing opens and saves a draft listing for the partner agency.
- Edit listing updates an existing listing.
- Refresh listing updates freshness and resubmits the listing.
- Submit update moves the listing into review.
- Upload evidence creates a review response/evidence record and returns the listing to review when selected.
- Respond to review submits partner notes plus optional evidence URL.
- Request republish creates a pending republish decision and returns the listing to review.

## Buyer view

Routes:
- `/listing/:id`

Verify:
- Trust badge, freshness, publication state, last checked, partner verified, project checked, and private inventory markers match the reviewed listing state.

## Repo checks

Run:

```powershell
npm run lint
npm run typecheck
npm run build
```

Expected:
- All three commands pass.
