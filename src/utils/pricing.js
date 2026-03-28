export const ISO_PRICING = {
  // Base standards
  'ISO 9001:2015 (Quality Management)': { oneTime: 499, monthly: 59 },
  'ISO 14001:2015 (Environmental Management)': { oneTime: 499, monthly: 59 },
  'ISO 45001:2018 (Occupational Health & Safety)': { oneTime: 499, monthly: 59 },
  // Advanced standards
  'ISO 22000:2018 (Food Safety)': { oneTime: 799, monthly: 89 },
  'ISO/IEC 27001:2022 (Information Security)': { oneTime: 1299, monthly: 129 },
  'ISO 13485:2016 (Medical Devices)': { oneTime: 1499, monthly: 149 },
};

export const TIER_MULTIPLIERS = {
  START: { oneTime: 0, monthly: 0 },
  POPULAR: { oneTime: 200, monthly: 20 },
  CORPORATE: { oneTime: 500, monthly: 50 },
};

export const calculatePrice = (isoString, packageTier, isMonthly) => {
  // Default to 9001 base pricing if unknown
  const basePrice = ISO_PRICING[isoString] || { oneTime: 499, monthly: 59 };
  
  // Clean up packageTier (e.g., from 'popular' or 'POPULAR_PACKAGE' to 'POPULAR')
  let tierKey = 'START';
  if (packageTier) {
    const upperTier = packageTier.toUpperCase();
    if (upperTier.includes('POPULAR')) tierKey = 'POPULAR';
    if (upperTier.includes('CORPORATE')) tierKey = 'CORPORATE';
  }
  
  const tierAddition = TIER_MULTIPLIERS[tierKey] || { oneTime: 0, monthly: 0 };
  
  if (isMonthly) {
    return basePrice.monthly + tierAddition.monthly;
  }
  return basePrice.oneTime + tierAddition.oneTime;
};

export const getPriceForISO = (isoString) => {
  return calculatePrice(isoString, 'START', false);
};
