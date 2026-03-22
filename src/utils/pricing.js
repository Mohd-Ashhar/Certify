export const ISO_PRICING = {
  'ISO/IEC 27001:2022 (Information Security)': 2499,
  'ISO 13485:2016 (Medical Devices)': 2999,
  'ISO 22000:2018 (Food Safety)': 1999,
  'ISO 9001:2015 (Quality Management)': 1499,
  'ISO 14001:2015 (Environmental Management)': 1499,
  'ISO 45001:2018 (Occupational Health & Safety)': 1499,
};

export const getPriceForISO = (isoString) => {
  if (!isoString) return 1499;
  return ISO_PRICING[isoString] || 1499;
};
