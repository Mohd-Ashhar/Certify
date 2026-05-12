import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight, Sparkles, Award, Headphones } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPriceForStandard } from '../../utils/pricing';
import { ROLES } from '../../utils/roles';
import './PricingTiers.css';

// Three-tier pricing card: Free gap analysis, Standard, and Premium.
// The Standard/Premium prices come from the per-standard pricing map —
// ISO 9001 / 14001 / 45001 sit at $799/$999, every other catalog standard
// sits at $999/$1299.
export default function PricingTiers({ variant = 'full', standardSlug = 'iso-9001' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const standardPrice = getPriceForStandard(standardSlug, 'standard');
  const premiumPrice  = getPriceForStandard(standardSlug, 'premium');

  const startCheckout = (tier) => {
    if (user?.role === ROLES.CLIENT) {
      navigate(`/client/start-payment?tier=${tier}&iso=${standardSlug}`);
    } else {
      navigate(`/start-checkout?tier=${tier}&iso=${standardSlug}`);
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
          <button className="pricing-tier__cta pricing-tier__cta--secondary" onClick={() => navigate('/gap-analysis')}>
            {t('pricing.tierFreeCta')} <ArrowRight size={16} />
          </button>
        </div>

        {/* Standard — most popular */}
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
          <button className="pricing-tier__cta pricing-tier__cta--primary" onClick={() => startCheckout('standard')}>
            {t('pricing.tierStandardCta')} <ArrowRight size={16} />
          </button>
        </div>

        {/* Premium */}
        <div className="pricing-tier pricing-tier--premium">
          <div className="pricing-tier__icon"><Headphones size={20} /></div>
          <h3 className="pricing-tier__name">{t('pricing.tierPremiumTitle')}</h3>
          <div className="pricing-tier__price">${premiumPrice.toLocaleString()}</div>
          <div className="pricing-tier__price-note">{t('pricing.tierPremiumPriceNote')}</div>
          <p className="pricing-tier__desc">{t('pricing.tierPremiumDesc')}</p>
          <ul className="pricing-tier__features">
            <li><Check size={16} /> {t('pricing.tierPremiumFeature1')}</li>
            <li><Check size={16} /> {t('pricing.tierPremiumFeature2')}</li>
            <li><Check size={16} /> {t('pricing.tierPremiumFeature3')}</li>
            <li><Check size={16} /> {t('pricing.tierPremiumFeature4')}</li>
          </ul>
          <button className="pricing-tier__cta pricing-tier__cta--secondary" onClick={() => startCheckout('premium')}>
            {t('pricing.tierPremiumCta')} <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <p className="pricing-tiers__disclaimer">{t('pricing.disclaimer')}</p>
    </section>
  );
}
