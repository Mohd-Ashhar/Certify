import { useParams, useNavigate, Link } from 'react-router-dom';
import { getStakeholderType, getStakeholderSlugs } from '../../utils/stakeholderTypes';
import {
  Shield, Award, Briefcase, Gift, Building2, UserCheck, TrendingUp,
  CheckCircle, BookOpen, ArrowRight, ArrowLeft,
} from 'lucide-react';
import './RegisterLanding.css';

const ICON_MAP = {
  Award, Briefcase, Gift, Building2, UserCheck, TrendingUp,
};

export default function RegisterLanding() {
  const { type } = useParams();
  const navigate = useNavigate();
  const config = getStakeholderType(type);

  if (!config) {
    return (
      <div className="reg-landing">
        <div className="reg-landing__container">
          <div className="reg-landing__header">
            <Link to="/" className="reg-landing__logo">
              <div className="reg-landing__logo-icon"><Shield size={22} /></div>
              <span className="reg-landing__logo-text">Certify.cx<sup className="brand-tm">&trade;</sup></span>
            </Link>
          </div>
          <div className="reg-landing__not-found">
            <h2>Invalid Registration Type</h2>
            <p>The registration type &quot;{type}&quot; is not recognized.</p>
            <Link to="/" className="reg-landing__btn reg-landing__btn--primary">Go to Homepage</Link>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = ICON_MAP[config.icon] || Building2;

  return (
    <div className="reg-landing">
      <div className="reg-landing__container">
        {/* Header */}
        <div className="reg-landing__header">
          <Link to="/" className="reg-landing__logo">
            <div className="reg-landing__logo-icon"><Shield size={22} /></div>
            <span className="reg-landing__logo-text">Certify.cx<sup className="brand-tm">&trade;</sup></span>
          </Link>
        </div>

        {/* Hero */}
        <div className="reg-landing__hero">
          <div className="reg-landing__hero-icon" style={{ background: `${config.color}18`, color: config.color }}>
            <IconComponent size={40} />
          </div>
          <h1 className="reg-landing__hero-title">{config.title}</h1>
          <p className="reg-landing__hero-desc">{config.description}</p>
          <button
            className="reg-landing__btn reg-landing__btn--primary reg-landing__btn--lg"
            onClick={() => navigate(`/signup?type=${config.id}`)}
          >
            Register Now <ArrowRight size={18} />
          </button>
        </div>

        {/* Benefits */}
        <section className="reg-landing__section">
          <h2 className="reg-landing__section-title">
            <CheckCircle size={20} className="reg-landing__section-icon reg-landing__section-icon--green" />
            Benefits
          </h2>
          <div className="reg-landing__cards">
            {config.benefits.map((benefit, i) => (
              <div key={i} className="reg-landing__card">
                <div className="reg-landing__card-num" style={{ color: config.color }}>{String(i + 1).padStart(2, '0')}</div>
                <p className="reg-landing__card-text">{benefit}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Rules & Regulations */}
        <section className="reg-landing__section">
          <h2 className="reg-landing__section-title">
            <BookOpen size={20} className="reg-landing__section-icon reg-landing__section-icon--blue" />
            Rules &amp; Regulations
          </h2>
          <div className="reg-landing__rules">
            {config.rules.map((rule, i) => (
              <div key={i} className="reg-landing__rule">
                <div className="reg-landing__rule-dot" style={{ background: config.color }} />
                <p className="reg-landing__rule-text">{rule}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Footer */}
        <div className="reg-landing__cta">
          <h3 className="reg-landing__cta-title">Ready to get started?</h3>
          <p className="reg-landing__cta-desc">
            Join CertifyCX as {config.singularTitle === 'Investor' ? 'an' : 'a'} {config.singularTitle} and be part of the future of ISO certification.
          </p>
          <div className="reg-landing__cta-actions">
            <button
              className="reg-landing__btn reg-landing__btn--primary reg-landing__btn--lg"
              onClick={() => navigate(`/signup?type=${config.id}`)}
            >
              Register as {config.singularTitle} <ArrowRight size={18} />
            </button>
            <Link to="/login" className="reg-landing__btn reg-landing__btn--secondary">
              Already have an account? Sign In
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="reg-landing__footer">
          <p>&copy; 2026 Certify.cx&trade;. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
