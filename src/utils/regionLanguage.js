// Region-based default language resolution.
// Maps the user's country to one of the three supported app languages: en, ar, es.
// Anything outside the explicit Arabic/Spanish lists falls back to English
// (so India, US, UK, Germany, Japan, etc. all default to en).

const ARABIC_COUNTRIES = new Set([
  'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ', 'SY', 'YE', 'PS',
  'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'SO', 'DJ', 'MR',
]);

const SPANISH_COUNTRIES = new Set([
  'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY',
  'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'CU', 'DO', 'PR', 'GQ',
]);

// Timezone IANA city → ISO country code. Used as an offline fallback when the
// IP lookup fails (e.g. offline, blocked, or rate-limited).
const TIMEZONE_TO_COUNTRY = {
  // Arabic-speaking
  'asia/riyadh': 'SA', 'asia/dubai': 'AE', 'asia/qatar': 'QA',
  'asia/kuwait': 'KW', 'asia/bahrain': 'BH', 'asia/muscat': 'OM',
  'asia/amman': 'JO', 'asia/beirut': 'LB', 'asia/baghdad': 'IQ',
  'asia/damascus': 'SY', 'asia/aden': 'YE', 'asia/gaza': 'PS',
  'asia/hebron': 'PS', 'africa/cairo': 'EG', 'africa/tripoli': 'LY',
  'africa/tunis': 'TN', 'africa/algiers': 'DZ', 'africa/casablanca': 'MA',
  'africa/el_aaiun': 'MA', 'africa/khartoum': 'SD', 'africa/mogadishu': 'SO',
  'africa/djibouti': 'DJ', 'africa/nouakchott': 'MR',
  // Spanish-speaking
  'europe/madrid': 'ES', 'atlantic/canary': 'ES',
  'america/mexico_city': 'MX', 'america/cancun': 'MX', 'america/monterrey': 'MX',
  'america/tijuana': 'MX', 'america/chihuahua': 'MX', 'america/hermosillo': 'MX',
  'america/argentina/buenos_aires': 'AR', 'america/argentina/cordoba': 'AR',
  'america/argentina/mendoza': 'AR', 'america/argentina/salta': 'AR',
  'america/bogota': 'CO', 'america/santiago': 'CL', 'america/lima': 'PE',
  'america/caracas': 'VE', 'america/guayaquil': 'EC', 'america/la_paz': 'BO',
  'america/asuncion': 'PY', 'america/montevideo': 'UY', 'america/guatemala': 'GT',
  'america/tegucigalpa': 'HN', 'america/el_salvador': 'SV', 'america/managua': 'NI',
  'america/costa_rica': 'CR', 'america/panama': 'PA', 'america/havana': 'CU',
  'america/santo_domingo': 'DO', 'america/puerto_rico': 'PR',
};

const SUPPORTED = new Set(['en', 'ar', 'es']);
const COUNTRY_CACHE_KEY = 'certifycx-detected-country';
const COUNTRY_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function languageForCountry(countryCode) {
  if (!countryCode) return null;
  const code = countryCode.toUpperCase();
  if (ARABIC_COUNTRIES.has(code)) return 'ar';
  if (SPANISH_COUNTRIES.has(code)) return 'es';
  return 'en';
}

function countryFromTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return null;
    return TIMEZONE_TO_COUNTRY[tz.toLowerCase()] || null;
  } catch {
    return null;
  }
}

function countryFromBrowserLocale() {
  const locales = navigator.languages || [navigator.language];
  for (const locale of locales) {
    const region = locale.split('-')[1];
    if (region && region.length === 2) return region.toUpperCase();
  }
  return null;
}

function readCachedCountry() {
  try {
    const raw = localStorage.getItem(COUNTRY_CACHE_KEY);
    if (!raw) return null;
    const { code, ts } = JSON.parse(raw);
    if (!code || !ts || Date.now() - ts > COUNTRY_CACHE_TTL_MS) return null;
    return code;
  } catch {
    return null;
  }
}

function writeCachedCountry(code) {
  try {
    localStorage.setItem(COUNTRY_CACHE_KEY, JSON.stringify({ code, ts: Date.now() }));
  } catch {
    /* storage unavailable; ignore */
  }
}

async function fetchCountryFromIP(timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const code = data?.country_code || data?.country;
    if (typeof code === 'string' && code.length === 2) return code.toUpperCase();
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Synchronous best-effort detection. Used at app startup before async results
// land, so the first paint is in the right language whenever possible.
export function detectCountrySync() {
  return readCachedCountry() || countryFromTimezone() || countryFromBrowserLocale();
}

// Async detection. Tries IP first (most accurate), then falls back to sync
// signals. Caches the IP result to avoid repeated network calls.
export async function detectCountry() {
  const cached = readCachedCountry();
  if (cached) return cached;

  const ipCode = await fetchCountryFromIP();
  if (ipCode) {
    writeCachedCountry(ipCode);
    return ipCode;
  }
  return countryFromTimezone() || countryFromBrowserLocale();
}

export async function detectLanguageFromRegion() {
  const country = await detectCountry();
  return languageForCountry(country);
}

export function detectLanguageFromRegionSync() {
  const country = detectCountrySync();
  return languageForCountry(country);
}

export function applyDocumentDirection(lang) {
  if (!SUPPORTED.has(lang)) return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export const SUPPORTED_LANGUAGES = SUPPORTED;
