import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, ArrowRight, CheckCircle2, Award, Globe2,
  FileCheck2, Users, Building2, ChevronRight, Star,
  Zap, Lock, BarChart3, Apple, GraduationCap, Scale, Activity, Stethoscope,
} from 'lucide-react';
import { STAKEHOLDER_TYPES } from '../../utils/stakeholderTypes';
import { ISO_CATALOG_LIST } from '../../utils/isoCatalog';
import SaraChatWidget from '../../components/sara/SaraChatWidget';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './LandingPage.css';

const ICON_MAP = {
  Award, Globe2, Shield, Lock, Apple, GraduationCap, Zap, Scale, Activity, Stethoscope,
};

export default function LandingPage() {
  const { t } = useTranslation();

  const ISO_STANDARDS = ISO_CATALOG_LIST.map(iso => ({
    slug: iso.slug,
    code: iso.code,
    title: t(iso.titleKey),
    desc: t(iso.descKey),
    icon: ICON_MAP[iso.icon] || Award,
    color: iso.color,
  }));

  const STEPS = [
    { step: '01', title: t('landing.step1Title'), desc: t('landing.step1Desc'), icon: Building2 },
    { step: '02', title: t('landing.step2Title'), desc: t('landing.step2Desc'), icon: FileCheck2 },
    { step: '03', title: t('landing.step3Title'), desc: t('landing.step3Desc'), icon: Award },
  ];

  const BENEFITS = [
    { icon: Star, title: t('landing.benefitGlobalTitle'), desc: t('landing.benefitGlobalDesc') },
    { icon: Zap, title: t('landing.benefitFastTitle'), desc: t('landing.benefitFastDesc') },
    { icon: Lock, title: t('landing.benefitSecureTitle'), desc: t('landing.benefitSecureDesc') },
    { icon: BarChart3, title: t('landing.benefitTrackingTitle'), desc: t('landing.benefitTrackingDesc') },
    { icon: Users, title: t('landing.benefitAuditorsTitle'), desc: t('landing.benefitAuditorsDesc') },
    { icon: Globe2, title: t('landing.benefitRegionTitle'), desc: t('landing.benefitRegionDesc') },
  ];

  const STAKEHOLDER_LIST = Object.values(STAKEHOLDER_TYPES);

  return (
    <div className="landing">
      {/* ---- Navbar ---- */}
      <nav className="landing__nav">
        <div className="landing__nav-inner">
          <Link to="/" className="landing__logo">
            <div className="landing__logo-icon"><Shield size={22} /></div>
            <span>Certify.cx<sup className="brand-tm">™</sup></span>
          </Link>
          <div className="landing__nav-links">
            <a href="#how-it-works" className="landing__nav-link">{t('nav.howItWorks')}</a>
            <a href="#standards" className="landing__nav-link">{t('nav.standards')}</a>
            <a href="#benefits" className="landing__nav-link">{t('nav.benefits')}</a>
            <LanguageSwitcher variant="landing" />
            <Link to="/login" className="landing__nav-link landing__nav-link--login">{t('nav.login')}</Link>
            <Link to="/signup" className="landing__nav-btn">{t('nav.startGapAnalysis')}</Link>
          </div>
        </div>
      </nav>

      {/* ---- Hero Section ---- */}
      <section className="landing__hero">
        <div className="landing__hero-bg" />
        <div className="landing__hero-content">
          <div className="landing__hero-badge">
            <Shield size={14} /> {t('landing.iafBadge')}
          </div>
          <h1 className="landing__hero-title">
            {t('landing.heroTitle')}<br />
            <span className="landing__hero-accent">{t('landing.heroAccent')}</span>
          </h1>
          <p className="landing__hero-subtitle">
            {t('landing.heroSubtitle')}
          </p>
          <div className="landing__hero-actions">
            <Link to="/signup" className="landing__btn landing__btn--primary">
              {t('nav.startGapAnalysis')} <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="landing__btn landing__btn--secondary">
              {t('nav.login')}
            </Link>
          </div>
          <div className="landing__hero-stats">
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-number">2,500+</span>
              <span className="landing__hero-stat-label">{t('landing.statCompanies')}</span>
            </div>
            <div className="landing__hero-stat-divider" />
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-number">5</span>
              <span className="landing__hero-stat-label">{t('landing.statRegions')}</span>
            </div>
            <div className="landing__hero-stat-divider" />
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-number">98%</span>
              <span className="landing__hero-stat-label">{t('landing.statApproval')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section className="landing__section" id="how-it-works">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-tag">{t('landing.processTag')}</span>
            <h2 className="landing__section-title">{t('landing.howCertWorks')}</h2>
            <p className="landing__section-desc">{t('landing.howCertDesc')}</p>
          </div>
          <div className="landing__steps">
            {STEPS.map((s, i) => (
              <div key={s.step} className="landing__step">
                <div className="landing__step-number">{s.step}</div>
                <div className="landing__step-icon"><s.icon size={24} /></div>
                <h3 className="landing__step-title">{s.title}</h3>
                <p className="landing__step-desc">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="landing__step-arrow"><ChevronRight size={20} /></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Supported ISO Standards ---- */}
      <section className="landing__section landing__section--dark" id="standards">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-tag">{t('landing.standardsTag')}</span>
            <h2 className="landing__section-title">{t('landing.supportedStandards')}</h2>
            <p className="landing__section-desc">{t('landing.supportedStandardsDesc')}</p>
          </div>
          <div className="landing__standards">
            {ISO_STANDARDS.map((std) => (
              <Link
                key={std.code}
                to={`/iso/${std.slug}`}
                className="landing__standard-card landing__standard-card--clickable"
                style={{ '--card-accent': std.color }}
              >
                <div className="landing__standard-icon"><std.icon size={28} /></div>
                <div className="landing__standard-code">{std.code}</div>
                <h3 className="landing__standard-title">{std.title}</h3>
                <p className="landing__standard-desc">{std.desc}</p>
                <span className="landing__standard-cta">
                  {t('iso.applyNow')} <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Benefits ---- */}
      <section className="landing__section" id="benefits">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-tag">{t('landing.whyCertify')}</span>
            <h2 className="landing__section-title">{t('landing.benefitsTitle')}</h2>
            <p className="landing__section-desc">{t('landing.benefitsDesc')}</p>
          </div>
          <div className="landing__benefits">
            {BENEFITS.map((b) => (
              <div key={b.title} className="landing__benefit-card">
                <div className="landing__benefit-icon"><b.icon size={22} /></div>
                <h3 className="landing__benefit-title">{b.title}</h3>
                <p className="landing__benefit-desc">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA Banner ---- */}
      <section className="landing__cta">
        <div className="landing__cta-inner">
          <h2 className="landing__cta-title">{t('landing.ctaTitle')}</h2>
          <p className="landing__cta-desc">{t('landing.ctaDesc')}</p>
          <Link to="/signup" className="landing__btn landing__btn--primary landing__btn--lg">
            {t('nav.startGapAnalysis')} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <div className="landing__footer-cols">
            <div className="landing__footer-col landing__footer-col--brand">
              <div className="landing__footer-logo">
                <div className="landing__logo-icon landing__logo-icon--sm"><Shield size={16} /></div>
                <span>Certify.cx<sup className="brand-tm">™</sup></span>
              </div>
              <p className="landing__footer-tagline">{t('landing.footerTagline')}</p>
            </div>
            <div className="landing__footer-col">
              <h4 className="landing__footer-heading">{t('landing.footerProduct')}</h4>
              <a href="#how-it-works" className="landing__footer-link">{t('nav.howItWorks')}</a>
              <a href="#standards" className="landing__footer-link">{t('landing.footerISOStandards')}</a>
              <a href="#benefits" className="landing__footer-link">{t('nav.benefits')}</a>
              <Link to="/signup" className="landing__footer-link">{t('landing.footerGetCertified')}</Link>
            </div>
            <div className="landing__footer-col">
              <h4 className="landing__footer-heading">{t('landing.footerAccount')}</h4>
              <Link to="/login" className="landing__footer-link">{t('nav.login')}</Link>
              <Link to="/signup" className="landing__footer-link">{t('landing.footerSignUp')}</Link>
              <Link to="/forgot-password" className="landing__footer-link">{t('landing.footerResetPassword')}</Link>
            </div>
            <div className="landing__footer-col">
              <h4 className="landing__footer-heading">{t('landing.footerJoinNetwork')}</h4>
              {STAKEHOLDER_LIST.map((type) => (
                <Link key={type.id} to={`/register/${type.id}`} className="landing__footer-link">
                  {type.singularTitle}
                </Link>
              ))}
            </div>
          </div>
          <div className="landing__footer-bottom">
            <p className="landing__footer-text">{t('common.allRightsReserved')}</p>
          </div>
        </div>
      </footer>

      <SaraChatWidget />
    </div>
  );
}
