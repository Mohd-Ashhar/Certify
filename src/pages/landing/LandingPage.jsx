import { Link } from 'react-router-dom';
import {
  Shield, ArrowRight, CheckCircle2, Award, Globe2,
  FileCheck2, Users, Building2, ChevronRight, Star,
  Zap, Lock, BarChart3
} from 'lucide-react';
import './LandingPage.css';

const ISO_STANDARDS = [
  {
    code: 'ISO 9001',
    title: 'Quality Management',
    desc: 'Demonstrate your ability to consistently provide products and services that meet customer and regulatory requirements.',
    icon: Award,
    color: '#3ECF8E',
  },
  {
    code: 'ISO 14001',
    title: 'Environmental Management',
    desc: 'Show your commitment to environmental responsibility and sustainable operations.',
    icon: Globe2,
    color: '#00C2FF',
  },
  {
    code: 'ISO 45001',
    title: 'Occupational Health & Safety',
    desc: 'Protect your workforce with internationally recognized health and safety standards.',
    icon: Shield,
    color: '#A78BFA',
  },
  {
    code: 'ISO 22000',
    title: 'Food Safety Management',
    desc: 'Ensure food safety across the entire supply chain from farm to fork.',
    icon: CheckCircle2,
    color: '#F59E0B',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Register Your Company',
    desc: 'Create an account and provide your company details to get started.',
    icon: Building2,
  },
  {
    step: '02',
    title: 'Select ISO Standard',
    desc: 'Choose the certification type that fits your business needs.',
    icon: FileCheck2,
  },
  {
    step: '03',
    title: 'Auditor Assignment',
    desc: 'An IAF-accredited auditor is assigned to evaluate your processes.',
    icon: Users,
  },
  {
    step: '04',
    title: 'Receive Certification',
    desc: 'After a successful audit, receive your internationally recognized certificate.',
    icon: Award,
  },
];

const BENEFITS = [
  { icon: Star, title: 'Global Recognition', desc: 'IAF-accredited certifications recognized in 100+ countries worldwide.' },
  { icon: Zap, title: 'Fast Processing', desc: 'Streamlined digital workflow reduces certification time by up to 60%.' },
  { icon: Lock, title: 'Secure & Compliant', desc: 'Enterprise-grade security with full audit trails and compliance tracking.' },
  { icon: BarChart3, title: 'Real-time Tracking', desc: 'Monitor your certification status and progress from a single dashboard.' },
  { icon: Users, title: 'Expert Auditors', desc: 'Access a network of certified auditors across all major regions.' },
  { icon: Globe2, title: 'Multi-Region Support', desc: 'Operations in Middle East, Asia, India, Europe, and North America.' },
];

export default function LandingPage() {
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
            <a href="#how-it-works" className="landing__nav-link">How It Works</a>
            <a href="#standards" className="landing__nav-link">Standards</a>
            <a href="#benefits" className="landing__nav-link">Benefits</a>
            <Link to="/login" className="landing__nav-link landing__nav-link--login">Login</Link>
            <Link to="/signup" className="landing__nav-btn">Apply for Certification</Link>
          </div>
        </div>
      </nav>

      {/* ---- Hero Section ---- */}
      <section className="landing__hero">
        <div className="landing__hero-bg" />
        <div className="landing__hero-content">
          <div className="landing__hero-badge">
            <Shield size={14} /> IAF Accredited Partner
          </div>
          <h1 className="landing__hero-title">
            IAF Accredited<br />
            <span className="landing__hero-accent">ISO Certifications</span>
          </h1>
          <p className="landing__hero-subtitle">
            The fastest way for businesses to achieve internationally recognized 
            ISO certifications. Apply online, get audited, and receive your 
            certificate — all from one platform.
          </p>
          <div className="landing__hero-actions">
            <Link to="/signup" className="landing__btn landing__btn--primary">
              Apply for Certification <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="landing__btn landing__btn--secondary">
              Login
            </Link>
          </div>
          <div className="landing__hero-stats">
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-number">2,500+</span>
              <span className="landing__hero-stat-label">Companies Certified</span>
            </div>
            <div className="landing__hero-stat-divider" />
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-number">5</span>
              <span className="landing__hero-stat-label">Global Regions</span>
            </div>
            <div className="landing__hero-stat-divider" />
            <div className="landing__hero-stat">
              <span className="landing__hero-stat-number">98%</span>
              <span className="landing__hero-stat-label">Approval Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---- How It Works ---- */}
      <section className="landing__section" id="how-it-works">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-tag">Process</span>
            <h2 className="landing__section-title">How Certification Works</h2>
            <p className="landing__section-desc">
              From registration to certification in four simple steps
            </p>
          </div>
          <div className="landing__steps">
            {STEPS.map((s, i) => (
              <div key={s.step} className="landing__step">
                <div className="landing__step-number">{s.step}</div>
                <div className="landing__step-icon"><s.icon size={24} /></div>
                <h3 className="landing__step-title">{s.title}</h3>
                <p className="landing__step-desc">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="landing__step-arrow">
                    <ChevronRight size={20} />
                  </div>
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
            <span className="landing__section-tag">Standards</span>
            <h2 className="landing__section-title">Supported ISO Standards</h2>
            <p className="landing__section-desc">
              We support the most requested international standards
            </p>
          </div>
          <div className="landing__standards">
            {ISO_STANDARDS.map((std) => (
              <div key={std.code} className="landing__standard-card" style={{ '--card-accent': std.color }}>
                <div className="landing__standard-icon"><std.icon size={28} /></div>
                <div className="landing__standard-code">{std.code}</div>
                <h3 className="landing__standard-title">{std.title}</h3>
                <p className="landing__standard-desc">{std.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Benefits ---- */}
      <section className="landing__section" id="benefits">
        <div className="landing__section-inner">
          <div className="landing__section-header">
            <span className="landing__section-tag">Why Certify.cx<sup className="brand-tm">™</sup></span>
            <h2 className="landing__section-title">Benefits of Certification</h2>
            <p className="landing__section-desc">
              Join thousands of companies that trust Certify.cx<sup className="brand-tm">™</sup> for their ISO needs
            </p>
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
          <h2 className="landing__cta-title">Ready to get certified?</h2>
          <p className="landing__cta-desc">
            Start your ISO certification journey today. It takes less than 5 minutes to apply.
          </p>
          <Link to="/signup" className="landing__btn landing__btn--primary landing__btn--lg">
            Apply for Certification <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <div className="landing__footer-logo">
            <Shield size={18} />
            <span>Certify.cx<sup className="brand-tm">™</sup></span>
          </div>
          <p className="landing__footer-text">
            © 2026 Certify.cx<sup className="brand-tm">™</sup>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
