export function isPartnerEligible(partner, lead) {
  if (!partner || partner.status !== 'active') return false;
  if (partner.blacklisted) return false;

  const countryMatch = !lead.country || !partner.country || partner.country === lead.country;
  const canHandlePrivate = !lead.is_private_inventory || partner.private_inventory_enabled === true;
  const canHandleConcierge = !lead.is_concierge || partner.concierge_enabled === true;
  const minBudget = Number(partner.min_budget || 0);
  const maxBudget = Number(partner.max_budget || Number.MAX_SAFE_INTEGER);
  const leadBudget = Number(lead.budget_max || lead.budget_min || 0);
  const budgetMatch = !leadBudget || (leadBudget >= minBudget && leadBudget <= maxBudget);

  return countryMatch && canHandlePrivate && canHandleConcierge && budgetMatch;
}

export function buildPartnerRoutingScore(partner, metrics = {}) {
  const trustScore = Number(partner.partner_trust_score || 0);
  const performanceScore = Number(partner.performance_score ?? metrics.performanceScore ?? 0);
  const capacityScore = Number(metrics.capacityScore || 0);
  const responsivenessScore = Number(partner.response_score ?? metrics.responsivenessScore ?? 0);
  const routingWeight = Number(partner.routing_weight || 1);
  return (trustScore * 0.3 + performanceScore * 0.3 + capacityScore * 0.25 + responsivenessScore * 0.15) * routingWeight;
}

export function summariseRoutingReason({ partner, lead, metrics, mode }) {
  const reasons = [mode || 'rule_based'];
  if (lead.country && partner.country) reasons.push(`geo:${partner.country}`);
  if (lead.is_private_inventory) reasons.push('private_inventory_match');
  if (lead.is_concierge) reasons.push('concierge_match');
  if (metrics.capacityScore != null) reasons.push(`capacity:${metrics.capacityScore}`);
  if ((partner.performance_score ?? metrics.performanceScore) != null) reasons.push(`performance:${partner.performance_score ?? metrics.performanceScore}`);
  if ((partner.response_score ?? metrics.responsivenessScore) != null) reasons.push(`response:${partner.response_score ?? metrics.responsivenessScore}`);
  if (partner.routing_weight != null) reasons.push(`weight:${partner.routing_weight}`);
  if (partner.partner_trust_score != null) reasons.push(`trust:${partner.partner_trust_score}`);
  return reasons.join(' | ');
}

export function rankEligiblePartners(partners, lead, partnerMetrics = {}) {
  return partners
    .filter((partner) => isPartnerEligible(partner, lead))
    .map((partner) => {
      const metrics = partnerMetrics[partner.id] || {};
      return {
        partner,
        metrics,
        score: buildPartnerRoutingScore(partner, metrics),
        routingReason: summariseRoutingReason({ partner, lead, metrics, mode: 'enterprise_routing' })
      };
    })
    .sort((a, b) => b.score - a.score);
}