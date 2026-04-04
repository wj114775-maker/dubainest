import { base44 } from '@/api/base44Client';
import { captureAnonymousAttribution, createOrEnrichLeadFromIntent, getSessionId } from '@/components/leads/leadEngine';

export async function saveListingToShortlist(listing) {
  const sessionId = getSessionId();
  captureAnonymousAttribution({ first_action_type: 'shortlist_save', last_action_type: 'shortlist_save', first_property_id: listing.id });
  const records = await base44.entities.Shortlist.list('-updated_date', 50);
  const existing = records.find((item) => item.session_id === sessionId);
  if (existing) {
    const nextIds = Array.from(new Set([...(existing.listing_ids || []), listing.id]));
    return base44.entities.Shortlist.update(existing.id, { listing_ids: nextIds });
  }
  return base44.entities.Shortlist.create({ session_id: sessionId, name: 'My shortlist', listing_ids: [listing.id], is_private: true });
}

export async function saveListingToCompare(listing) {
  const sessionId = getSessionId();
  captureAnonymousAttribution({ first_action_type: 'compare_add', last_action_type: 'compare_add', first_property_id: listing.id });
  const records = await base44.entities.CompareSet.list('-updated_date', 50);
  const existing = records.find((item) => item.session_id === sessionId);
  if (existing) {
    const nextIds = Array.from(new Set([...(existing.listing_ids || []), listing.id]));
    return base44.entities.CompareSet.update(existing.id, { listing_ids: nextIds });
  }
  return base44.entities.CompareSet.create({ session_id: sessionId, listing_ids: [listing.id], compare_mode: 'purchase' });
}

export async function captureBuyerIntent(payload) {
  return createOrEnrichLeadFromIntent(payload);
}
