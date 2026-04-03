// -------------------------------------------------------
// Country Tier Classification
// Tier 1: Developed economies (higher pricing)
// Tier 2: Developing economies (same as ISO 9001 base)
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
  if (!country) return 1;
  return TIER1_COUNTRIES.includes(country.toLowerCase().trim()) ? 1 : 2;
}

// -------------------------------------------------------
// Pricing per country tier
// Payment options: Full Payment & 12-Month Recurring
//
// Tier 1: Higher rate
// Tier 2: Same as ISO 9001 base rate
// -------------------------------------------------------
const PRICES = {
  tier1: { oneTime: 799, monthly: 89 },
  tier2: { oneTime: 499, monthly: 59 },
};

export const calculatePrice = (isoString, isMonthly = false, countryTier = 1) => {
  const base = countryTier === 2 ? PRICES.tier2 : PRICES.tier1;
  return isMonthly ? base.monthly : base.oneTime;
};

export const getFullPrice = (countryTier = 1) => {
  return countryTier === 2 ? PRICES.tier2.oneTime : PRICES.tier1.oneTime;
};

export const getMonthlyPrice = (countryTier = 1) => {
  return countryTier === 2 ? PRICES.tier2.monthly : PRICES.tier1.monthly;
};

export const getPriceForISO = (isoString, countryTier = 1) => calculatePrice(isoString, false, countryTier);
