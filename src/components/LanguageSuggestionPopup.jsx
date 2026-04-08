import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, X } from 'lucide-react';
import './LanguageSuggestionPopup.css';

// Countries where Arabic is the primary language
const ARABIC_COUNTRIES = [
  'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ', 'SY', 'YE', 'PS',
  'EG', 'LY', 'TN', 'DZ', 'MA', 'SD', 'SO', 'DJ', 'MR',
];

// Countries where Spanish is the primary language
const SPANISH_COUNTRIES = [
  'ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY',
  'GT', 'HN', 'SV', 'NI', 'CR', 'PA', 'CU', 'DO', 'PR',
];

function detectSuggestedLanguage() {
  // Check browser language preferences first
  const browserLangs = navigator.languages || [navigator.language];
  for (const lang of browserLangs) {
    const code = lang.toLowerCase().split('-')[0];
    if (code === 'ar') return 'ar';
    if (code === 'es') return 'es';
  }

  // Check timezone as a region hint
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const tzLower = tz.toLowerCase();

  // Arabic timezone regions
  if (['asia/riyadh', 'asia/dubai', 'asia/qatar', 'asia/kuwait', 'asia/bahrain',
       'asia/muscat', 'asia/amman', 'asia/beirut', 'asia/baghdad', 'asia/damascus',
       'asia/aden', 'asia/gaza', 'africa/cairo', 'africa/tripoli', 'africa/tunis',
       'africa/algiers', 'africa/casablanca', 'africa/khartoum'].some(t => tzLower.includes(t.split('/')[1]))) {
    return 'ar';
  }

  // Spanish timezone regions
  if (['europe/madrid', 'america/mexico_city', 'america/bogota', 'america/lima',
       'america/santiago', 'america/buenos_aires', 'america/caracas', 'america/guayaquil',
       'america/la_paz', 'america/asuncion', 'america/montevideo', 'america/guatemala',
       'america/tegucigalpa', 'america/el_salvador', 'america/managua', 'america/costa_rica',
       'america/panama', 'america/havana', 'america/santo_domingo'].some(t => tzLower.includes(t.split('/')[1]))) {
    return 'es';
  }

  return null;
}

export default function LanguageSuggestionPopup() {
  const { t, i18n } = useTranslation();
  const [show, setShow] = useState(false);
  const [suggestedLang, setSuggestedLang] = useState(null);

  useEffect(() => {
    // Don't show if user already chose a language
    const dismissed = localStorage.getItem('certifycx-lang-popup-dismissed');
    const currentLang = i18n.language;

    if (dismissed || currentLang !== 'en') {
      return;
    }

    const detected = detectSuggestedLanguage();
    if (detected && detected !== currentLang) {
      setSuggestedLang(detected);
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [i18n.language]);

  const handleSwitch = () => {
    i18n.changeLanguage(suggestedLang);
    localStorage.setItem('certifycx-lang', suggestedLang);
    localStorage.setItem('certifycx-lang-popup-dismissed', 'true');
    // Set document direction for Arabic
    document.documentElement.dir = suggestedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = suggestedLang;
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('certifycx-lang-popup-dismissed', 'true');
    setShow(false);
  };

  if (!show || !suggestedLang) return null;

  const langName = suggestedLang === 'ar' ? t('languageSuggestion.arabic') : t('languageSuggestion.spanish');
  const message = suggestedLang === 'ar' ? t('languageSuggestion.messageAr') : t('languageSuggestion.messageEs');

  return (
    <div className="lang-popup-overlay">
      <div className="lang-popup">
        <button className="lang-popup__close" onClick={handleDismiss} aria-label="Close">
          <X size={18} />
        </button>
        <div className="lang-popup__icon">
          <Globe size={28} />
        </div>
        <h3 className="lang-popup__title">{t('languageSuggestion.title')}</h3>
        <p className="lang-popup__message">{message}</p>
        <div className="lang-popup__actions">
          <button className="lang-popup__btn lang-popup__btn--primary" onClick={handleSwitch}>
            {t('languageSuggestion.switchTo', { language: langName })}
          </button>
          <button className="lang-popup__btn lang-popup__btn--secondary" onClick={handleDismiss}>
            {t('languageSuggestion.keepEnglish')}
          </button>
        </div>
      </div>
    </div>
  );
}
