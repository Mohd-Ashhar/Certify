const isPremium = (iso) => iso?.includes('22000');

// Base prices (START tier)
const BASE_PRICES = {
  standard: { oneTime: 499, monthly: 59 },
  premium:  { oneTime: 799, monthly: 89 },
};

// Tier add-ons on top of base price
const TIER_ADDONS = {
  START:     { oneTime: 0,   monthly: 0 },
  POPULAR:   { oneTime: 300, monthly: 30 },
  CORPORATE: { oneTime: 800, monthly: 80 },
};

export const calculatePrice = (isoString, tier = 'START', isMonthly = false) => {
  const base = isPremium(isoString) ? BASE_PRICES.premium : BASE_PRICES.standard;

  let tierKey = 'START';
  if (tier) {
    const upper = tier.toUpperCase();
    if (upper.includes('CORPORATE')) tierKey = 'CORPORATE';
    else if (upper.includes('POPULAR')) tierKey = 'POPULAR';
  }

  const addon = TIER_ADDONS[tierKey];
  return isMonthly ? base.monthly + addon.monthly : base.oneTime + addon.oneTime;
};

export const getPriceForISO = (isoString) => calculatePrice(isoString, 'START', false);
