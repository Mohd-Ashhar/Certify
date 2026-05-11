import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight, Sparkles, Award, Headphones } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFullPrice, getCountryTier, PREMIUM_PRICE } from '../../utils/pricing';
import { ROLES } from '../../utils/roles';
import './PricingTiers.css';

const PHASE_1_ISO_SLUG = 'iso-9001';

// Three-tier pricing: Free gap analysis, Standard ISO 9001 ($799), and Premium
// ($999 — Standard features + Quality Manual + 12 Months Support).
export default function PricingTiers({ variant = 'full' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const standardPrice = getFullPrice(getCountryTier(user?.country));

  const handleFree = () => navigate('/gap-analysis');
  const handleStandard = () => {
    if (user?.role === ROLES.CLIENT) {
      navigate('/client/start-payment?tier=standard&iso=iso-9001');
    } else {
      navigate(`/start-checkout?tier=standard&iso=${PHASE_1_ISO_SLUG}`);
    }
  };
  const handlePremium = () => {
    if (user?.role === ROLES.CLIENT) {
      navigate('/client/start-payment?tier=premium&iso=iso-9001');
    } else {
      navigate(`/start-checkout?tier=premium&iso=${PHASE_1_ISO_SLUG}`);
    }
  };

  return (
    <section className={`pricing-tiers ${variant === 'compact' ? 'pricing-tiers--compact' : ''}`}>
      <div className="pricing-tiers__header">
        <span className="pricing-tiers__tag">{t('pricing.sectionTag')}</span>
        <h2 className="pricing-tiers__title">{t('pricing.sectionTitle')}</h2>
        <p className="pricing-tiers__desc">{t('pricing.sectionDesc')}</p>
      </div>

      <div className="pricing-tiers__grid">
        {/* Free */}
        <div className="pricing-tier pricing-tier--free">
          <div className="pricing-tier__icon"><Sparkles size={20} /></div>
          <h3 className="pricing-tier__name">{t('pricing.tierFreeTitle')}</h3>
          <div className="pricing-tier__price">{t('pricing.tierFreePrice')}</div>
          <div className="pricing-tier__price-note">{t('pricing.tierFreePriceNote')}</div>
          <p className="pricing-tier__desc">{t('pricing.tierFreeDesc')}</p>
          <ul className="pricing-tier__features">
            <li><Check size={16} /> {t('pricing.tierFreeFeature1')}</li>
            <li><Check size={16} /> {t('pricing.tierFreeFeature2')}</li>
            <li><Check size={16} /> {t('pricing.tierFreeFeature3')}</li>
          </ul>
          <button className="pricing-tier__cta pricing-tier__cta--secondary" onClick={handleFree}>
            {t('pricing.tierFreeCta')} <ArrowRight size={16} />
          </button>
        </div>

        {/* Standard $799 — most popular */}
        <div className="pricing-tier pricing-tier--standard pricing-tier--featured">
          <span className="pricing-tier__badge">{t('pricing.mostPopular')}</span>
          <div className="pricing-tier__icon pricing-tier__icon--accent"><Award size={20} /></div>
          <h3 className="pricing-tier__name">{t('pricing.tierStandardTitle')}</h3>
          <div className="pricing-tier__price">${standardPrice.toLocaleString()}</div>
          <div className="pricing-tier__price-note">{t('pricing.tierStandardPriceNote')}</div>
          <p className="pricing-tier__desc">{t('pricing.tierStandardDesc')}</p>
          <ul className="pricing-tier__features">
            <li><Check size={16} /> {t('pricing.tierStandardFeature1')}</li>
            <li><Check size={16} /> {t('pricing.tierStandardFeature2')}</li>
            <li><Check size={16} /> {t('pricing.tierStandardFeature3')}</li>
            <li><Check size={16} /> {t('pricing.tierStandardFeature4')}</li>
          </ul>
          <button className="pricing-tier__cta pricing-tier__cta--primary" onClick={handleStandard}>
            {t('pricing.tierStandardCta')} <ArrowRight size={16} />
          </button>
        </div>

        {/* Premium — contact sales */}
        <div className="pricing-tier pricing-tier--premium">
          <div className="pricing-tier__icon"><Headphones size={20} /></div>
          <h3 className="pricing-tier__name">{t('pricing.tierPremiumTitle')}</h3>
          <div className="pricing-tier__price">${PREMIUM_PRICE.toLocaleString()}</div>
          <div className="pricing-tier__price-note">{t('pricing.tierPremiumPriceNote')}</div>
          <p className="pricing-tier__desc">{t('pricing.tierPremiumDesc')}</p>
          <ul className="pricing-tier__features">
            <li><Check size={16} /> {t('pricing.tierPremiumFeature1')}</li>
            <li><Check size={16} /> {t('pricing.tierPremiumFeature2')}</li>
            <li><Check size={16} /> {t('pricing.tierPremiumFeature3')}</li>
            <li><Check size={16} /> {t('pricing.tierPremiumFeature4')}</li>
          </ul>
          <button className="pricing-tier__cta pricing-tier__cta--secondary" onClick={handlePremium}>
            {t('pricing.tierPremiumCta')} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
