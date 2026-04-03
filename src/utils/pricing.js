const isPremium = (iso) => iso?.includes('22000');

// -------------------------------------------------------
// Country Tier Classification
// Tier 1: Developed economies (higher pricing)
// Tier 2: Developing economies (lower pricing)
// -------------------------------------------------------
const TIER1_COUNTRIES = [
  'united states', 'united states of america', 'usa', 'canada',
  'united kingdom', 'uk', 'germany', 'france', 'italy', 'spain',
  'netherlands', 'belgium', 'switzerland', 'austria', 'sweden',
  'norway', 'denmark', 'finland', 'ireland', 'portugal', 'luxembourg',
  'japan', 'south korea', 'singapore', 'australia', 'new zealand',
  'hong kong', 'taiwan', 'israel', 'united arab emirates', 'uae',
  'saudi arabia', 'ksa', 'qatar', 'kuwait', 'bahrain',
  'iceland', 'monaco', 'liechtenstein',
];

/**
 * Determine if a country is Tier 1 (developed) or Tier 2 (developing).
 * Returns 1 or 2.
 */
export function getCountryTier(country) {
  if (!country) return 1; // default to Tier 1 if unknown
  return TIER1_COUNTRIES.includes(country.toLowerCase().trim()) ? 1 : 2;
}

// -------------------------------------------------------
// Base prices for ISO 9001 (standard) per country tier
// Payment options: Full Payment & 12-Month Commitment Recurring
// -------------------------------------------------------
const BASE_PRICES = {
  // Tier 1 countries (developed economies)
  tier1: {
    standard: { oneTime: 799, monthly: 89 },   // ISO 9001, 14001, 45001
    premium:  { oneTime: 1099, monthly: 119 },  // ISO 22000
  },
  // Tier 2 countries (developing economies)
  tier2: {
    standard: { oneTime: 499, monthly: 59 },    // ISO 9001, 14001, 45001
    premium:  { oneTime: 799, monthly: 89 },     // ISO 22000
  },
};

// Tier add-ons on top of base price
const TIER_ADDONS = {
  START:     { oneTime: 0,   monthly: 0 },
  POPULAR:   { oneTime: 300, monthly: 30 },
  CORPORATE: { oneTime: 800, monthly: 80 },
};

export const calculatePrice = (isoString, tier = 'START', isMonthly = false, countryTier = 1) => {
  const pricingTier = countryTier === 2 ? BASE_PRICES.tier2 : BASE_PRICES.tier1;
  const base = isPremium(isoString) ? pricingTier.premium : pricingTier.standard;

  let tierKey = 'START';
  if (tier) {
    const upper = tier.toUpperCase();
    if (upper.includes('CORPORATE')) tierKey = 'CORPORATE';
    else if (upper.includes('POPULAR')) tierKey = 'POPULAR';
  }

  const addon = TIER_ADDONS[tierKey];
  return isMonthly ? base.monthly + addon.monthly : base.oneTime + addon.oneTime;
};

export const getPriceForISO = (isoString, countryTier = 1) => calculatePrice(isoString, 'START', false, countryTier);
