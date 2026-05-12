import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
  computeTotal,
  SURCHARGE_PER_EMPLOYEE_BAND,
  SURCHARGE_PER_LOCATION,
  INCLUDED_EMPLOYEES,
  EMPLOYEES_PER_BAND,
} from '../../utils/pricing';
import { Lock, Shield, CreditCard, CalendarClock, CheckCircle2, Sparkles, Tag, Plus, Minus, Users, MapPin } from 'lucide-react';

export default function PaymentPlaceholder() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [hasReferralDiscount, setHasReferralDiscount] = useState(false);

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Phase B surcharges — buyer can add 50-employee bands above the included
  // 10 and additional locations above the included 1. Each band/location
  // adds a flat $200.
  const [employeeBands, setEmployeeBands] = useState(0);
  const [additionalLocations, setAdditionalLocations] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const fetchApp = async () => {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .single();

        if (error) throw error;
        if (isMounted) setApplication(data);
      } catch (err) {
        console.error('Failed to fetch application:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (applicationId) fetchApp();
    return () => { isMounted = false; };
  }, [applicationId]);

  // Premium (Package 3) is one-time only — force the toggle off the moment
  // we learn we're on a Premium order, so the user can't get stuck on the
  // monthly tab.
  useEffect(() => {
    if (application?.selected_package === 'Premium' && isMonthly) {
      setIsMonthly(false);
    }
  }, [application?.selected_package, isMonthly]);

  // Check if client is eligible for referral discount
  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-discount', clientId: user.id }),
    })
      .then(r => r.json())
      .then(data => { if (data.hasDiscount) setHasReferralDiscount(true); })
      .catch(() => {});
  }, [user?.id]);

  // Pre-fill coupon from URL (?coupon=CODE) so shareable links auto-apply
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCoupon = params.get('coupon');
    if (urlCoupon && !coupon && !couponInput) {
      setCouponInput(urlCoupon);
      validateCoupon(urlCoupon);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractCouponCode = (raw) => {
    const trimmed = (raw || '').trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes('?') || trimmed.includes('=')) {
      try {
        const url = new URL(trimmed, 'https://placeholder.local');
        const fromQuery = url.searchParams.get('coupon') || url.searchParams.get('code');
        if (fromQuery) return fromQuery.trim();
      } catch {
        const m = trimmed.match(/[?&](?:coupon|code)=([^&\s]+)/i);
        if (m) return decodeURIComponent(m[1]).trim();
      }
    }
    return trimmed;
  };

  const validateCoupon = async (codeOverride) => {
    const code = extractCouponCode(codeOverride ?? couponInput);
    if (!code) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const r = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (data.valid) {
        setCoupon(data.coupon);
        setCouponInput(data.coupon.code);
      } else {
        setCoupon(null);
        setCouponError(
          data.reason === 'expired' ? t('coupons.expiredCoupon')
          : data.reason === 'exhausted' ? t('coupons.exhaustedCoupon')
          : data.reason === 'inactive' ? t('coupons.inactiveCoupon')
          : t('coupons.invalidCoupon')
        );
      }
    } catch {
      setCoupon(null);
      setCouponError(t('coupons.invalidCoupon'));
    } finally {
      setValidatingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const isoName = application?.recommended_iso || 'ISO 9001:2015';
  // Premium tier (Package 3) is one-time only — the monthly tab stays hidden.
  const isPremium = application?.selected_package === 'Premium';
  const tier = isPremium ? 'premium' : 'standard';

  // Both totals are computed unconditionally so each tile (Full / Monthly)
  // can display its own price. computeTotal is the same helper used by
  // api/checkout.js so client and server stay aligned.
  const fullTotals = computeTotal({
    standardSlug: isoName,
    tier,
    isMonthly: false,
    employeeBands,
    locations: additionalLocations,
  });
  const monthlyTotals = computeTotal({
    standardSlug: isoName,
    tier,
    isMonthly: true,
    employeeBands,
    locations: additionalLocations,
  });
  const fullPrice = fullTotals.subtotal;
  const monthlyPrice = monthlyTotals.subtotal;
  const originalPrice = isMonthly ? monthlyPrice : fullPrice;
  const activeTotals = isMonthly ? monthlyTotals : fullTotals;

  // Coupon and referral discount do not stack — the larger wins.
  const couponPct = coupon ? Number(coupon.discount_percent) : 0;
  const referralPct = hasReferralDiscount ? 10 : 0;
  const appliedDiscountPct = Math.max(couponPct, referralPct);
  const discountedPrice = appliedDiscountPct > 0
    ? Math.round(originalPrice * (1 - appliedDiscountPct / 100) * 100) / 100
    : originalPrice;
  const currentPrice = discountedPrice;

  const employeeRangeLabel = (bands) => {
    if (bands === 0) return t('payment.employeesIncluded', { count: INCLUDED_EMPLOYEES });
    const lower = INCLUDED_EMPLOYEES + (bands - 1) * EMPLOYEES_PER_BAND + 1;
    const upper = INCLUDED_EMPLOYEES + bands * EMPLOYEES_PER_BAND;
    return `${lower}–${upper}`;
  };

  const handleCheckout = async () => {
    if (!application) return;
    setProcessing(true);
    setCheckoutError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isoName,
          tier,
          isMonthly,
          applicationId,
          clientId: user?.id,
          couponCode: coupon?.code || null,
          employeeBands,
          additionalLocations,
        }),
      });

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          response.status >= 500
            ? 'The checkout server is temporarily unavailable. Please try again in a moment.'
            : `Unexpected response (${response.status}). Please try again or contact support.`
        );
      }
      if (!response.ok) throw new Error(data.error || 'Failed to initialize checkout');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', border: '3px solid rgba(37,99,235,0.15)', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: '#64748b', fontWeight: 500, fontSize: '0.95rem' }}>{t('payment.loadingOrder')}</p>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!application) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <p style={{ color: '#334155', fontSize: '1.1rem', fontWeight: 500 }}>{t('payment.appNotFound')}</p>
        <button onClick={() => navigate('/client/dashboard')} style={{ padding: '10px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>
          {t('payment.backToDashboard')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '3vh 16px', minHeight: '85vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 50%, #f0fdf4 100%)' }}>
      <div style={{ maxWidth: '560px', width: '100%' }}>

        {/* RETURN-TO-LANDING HEADER */}
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
          <Link
            to="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#0f172a', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem' }}
          >
            <Shield size={18} />
            <span>Certify.cx<sup className="brand-tm">&trade;</sup></span>
          </Link>
        </div>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', marginBottom: '16px', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)' }}>
            <CreditCard size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>{t('payment.completeOrder')}</h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>{t('payment.secureISO')}</p>
        </div>

        {/* DISCOUNT BANNER — coupon wins over referral if both present */}
        {appliedDiscountPct > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #6ee7b7', borderRadius: '14px', marginBottom: '20px' }}>
            <Tag size={20} color="#059669" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#065f46', fontSize: '0.95rem' }}>
                {coupon && couponPct >= referralPct
                  ? t('coupons.couponApplied', { percent: couponPct, code: coupon.code })
                  : t('payment.referralDiscount')}
              </p>
              <p style={{ margin: 0, color: '#047857', fontSize: '0.82rem' }}>
                {coupon && couponPct >= referralPct
                  ? (coupon.description || t('coupons.couponAppliedDesc'))
                  : t('payment.referralDiscountDesc')}
              </p>
            </div>
          </div>
        )}

        {/* COUPON INPUT */}
        <div style={{ background: 'white', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {t('coupons.haveCoupon')}
          </label>
          {coupon ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, padding: '8px 12px', background: '#ecfdf5', border: '1px solid #86efac', borderRadius: 8, fontFamily: 'monospace', fontWeight: 700, color: '#065f46' }}>
                {coupon.code} — {coupon.discount_percent}% off
              </div>
              <button type="button" onClick={clearCoupon} style={{ padding: '8px 14px', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
                {t('common.remove') || 'Remove'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={couponInput}
                onChange={e => setCouponInput(e.target.value.toUpperCase())}
                placeholder={t('coupons.enterCode')}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontFamily: 'monospace', fontSize: '0.9rem', textTransform: 'uppercase' }}
              />
              <button
                type="button"
                onClick={() => validateCoupon()}
                disabled={!couponInput.trim() || validatingCoupon}
                style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
              >
                {validatingCoupon ? t('common.processing') : t('coupons.applyCode')}
              </button>
            </div>
          )}
          {couponError && (
            <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#dc2626' }}>{couponError}</p>
          )}
        </div>

        {/* MAIN CARD */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 20px 40px -12px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)', overflow: 'hidden' }}>

          {/* ISO STANDARD BANNER */}
          <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)', padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
            <div style={{ position: 'absolute', bottom: '-30px', left: '-10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Shield size={20} color="white" />
              </div>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('payment.certStandard')}</p>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>{isoName}</h3>
              </div>
            </div>
          </div>

          <div style={{ padding: '28px' }}>

            {/* PRICING DISCLAIMER */}
            <div style={{ padding: '12px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', marginBottom: '20px', fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5 }}>
              {t('pricing.disclaimer')}
            </div>

            {/* ORG SIZE — additional employees & locations surcharges */}
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 12px 0' }}>{t('pricing.orgSize')}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '24px' }}>
              {/* Additional Employees stepper */}
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Users size={18} color="#475569" />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{t('pricing.additionalEmployees')}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                        {employeeRangeLabel(employeeBands)}
                        {employeeBands > 0 && ` · +$${(employeeBands * SURCHARGE_PER_EMPLOYEE_BAND).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setEmployeeBands(b => Math.max(0, b - 1))}
                      disabled={employeeBands === 0}
                      aria-label={t('pricing.decreaseEmployees')}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: employeeBands === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: employeeBands === 0 ? 0.5 : 1 }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{employeeBands}</span>
                    <button
                      type="button"
                      onClick={() => setEmployeeBands(b => b + 1)}
                      aria-label={t('pricing.increaseEmployees')}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Locations stepper */}
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MapPin size={18} color="#475569" />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#0f172a' }}>{t('pricing.additionalLocations')}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                        {additionalLocations === 0
                          ? t('pricing.locationsIncluded', { count: 1 })
                          : t('pricing.locationsExtra', { count: additionalLocations })}
                        {additionalLocations > 0 && ` · +$${(additionalLocations * SURCHARGE_PER_LOCATION).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setAdditionalLocations(n => Math.max(0, n - 1))}
                      disabled={additionalLocations === 0}
                      aria-label={t('pricing.decreaseLocations')}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: additionalLocations === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: additionalLocations === 0 ? 0.5 : 1 }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>{additionalLocations}</span>
                    <button
                      type="button"
                      onClick={() => setAdditionalLocations(n => n + 1)}
                      aria-label={t('pricing.increaseLocations')}
                      style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PAYMENT OPTIONS */}
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px 0' }}>{t('payment.choosePayment')}</h3>

            <div className="pay-options-grid" style={{ display: 'grid', gridTemplateColumns: isPremium ? '1fr' : '1fr 1fr', gap: '14px', marginBottom: '28px' }}>

              {/* FULL PAYMENT */}
              <button
                onClick={() => setIsMonthly(false)}
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  border: !isMonthly ? '2.5px solid #2563eb' : '2px solid #e2e8f0',
                  borderRadius: '16px',
                  background: !isMonthly ? 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.04))' : '#fafbfc',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  transform: !isMonthly ? 'translateY(-2px)' : 'none',
                  boxShadow: !isMonthly ? '0 8px 20px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {!isMonthly && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <CheckCircle2 size={20} color="#2563eb" fill="rgba(37,99,235,0.1)" />
                  </div>
                )}
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: !isMonthly ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', transition: 'all 0.25s ease' }}>
                  <CreditCard size={20} color={!isMonthly ? 'white' : '#94a3b8'} />
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: !isMonthly ? '#1e3a5f' : '#64748b' }}>{t('payment.fullPayment')}</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: !isMonthly ? '#0f172a' : '#94a3b8', lineHeight: 1.2, margin: '8px 0 4px 0' }}>
                  {appliedDiscountPct > 0 ? (
                    <>
                      <span style={{ textDecoration: 'line-through', fontSize: '1.1rem', color: '#94a3b8', marginRight: '6px' }}>${fullPrice}</span>
                      ${Math.round(fullPrice * (1 - appliedDiscountPct / 100) * 100) / 100}
                    </>
                  ) : (
                    `$${fullPrice}`
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>{t('payment.oneTimePayment')}</p>
                {!isMonthly && (
                  <div style={{ marginTop: '12px', padding: '4px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669' }}>{t('payment.bestValue')}</span>
                  </div>
                )}
              </button>

              {/* 12-MONTH RECURRING — hidden for Premium (one-time only) */}
              {!isPremium && (
              <button
                onClick={() => setIsMonthly(true)}
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  border: isMonthly ? '2.5px solid #2563eb' : '2px solid #e2e8f0',
                  borderRadius: '16px',
                  background: isMonthly ? 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(124,58,237,0.04))' : '#fafbfc',
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  transform: isMonthly ? 'translateY(-2px)' : 'none',
                  boxShadow: isMonthly ? '0 8px 20px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {isMonthly && (
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <CheckCircle2 size={20} color="#2563eb" fill="rgba(37,99,235,0.1)" />
                  </div>
                )}
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: isMonthly ? 'linear-gradient(135deg, #2563eb, #7c3aed)' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', transition: 'all 0.25s ease' }}>
                  <CalendarClock size={20} color={isMonthly ? 'white' : '#94a3b8'} />
                </div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: isMonthly ? '#1e3a5f' : '#64748b' }}>{t('payment.monthlyPlan')}</h4>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: isMonthly ? '#0f172a' : '#94a3b8', lineHeight: 1.2, margin: '8px 0 4px 0' }}>
                  {appliedDiscountPct > 0 ? (
                    <>
                      <span style={{ textDecoration: 'line-through', fontSize: '1.1rem', color: '#94a3b8', marginRight: '6px' }}>${monthlyPrice}</span>
                      ${Math.round(monthlyPrice * (1 - appliedDiscountPct / 100) * 100) / 100}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
                    </>
                  ) : (
                    <>${monthlyPrice}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>/mo</span></>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>{t('payment.monthlyCommitment')}</p>
                {isMonthly && (
                  <div style={{ marginTop: '12px', padding: '4px 10px', background: 'rgba(37,99,235,0.08)', borderRadius: '6px', display: 'inline-block' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563eb' }}>{t('payment.flexible')}</span>
                  </div>
                )}
              </button>
              )}
            </div>

            {/* DIVIDER */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent)', margin: '0 0 24px 0' }} />

            {/* LINE-ITEM BREAKDOWN — base + surcharges, only when surcharges apply */}
            {(activeTotals.employeeSurchargePerPeriod > 0 || activeTotals.locationSurchargePerPeriod > 0) && (
              <div style={{ marginBottom: '16px', padding: '14px 18px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569', marginBottom: 6 }}>
                  <span>{t('pricing.lineItem.base')}</span>
                  <span style={{ fontWeight: 600 }}>${activeTotals.base.toLocaleString()}{isMonthly ? '/mo' : ''}</span>
                </div>
                {activeTotals.employeeSurchargePerPeriod > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569', marginBottom: 6 }}>
                    <span>{t('pricing.lineItem.employees', { count: employeeBands })}</span>
                    <span style={{ fontWeight: 600 }}>+${activeTotals.employeeSurchargePerPeriod.toLocaleString()}{isMonthly ? '/mo' : ''}</span>
                  </div>
                )}
                {activeTotals.locationSurchargePerPeriod > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#475569' }}>
                    <span>{t('pricing.lineItem.locations', { count: additionalLocations })}</span>
                    <span style={{ fontWeight: 600 }}>+${activeTotals.locationSurchargePerPeriod.toLocaleString()}{isMonthly ? '/mo' : ''}</span>
                  </div>
                )}
              </div>
            )}

            {/* TOTAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isMonthly ? t('payment.monthlyPayment') : t('payment.totalAmount')}
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  {appliedDiscountPct > 0 && (
                    <span style={{ color: '#059669', fontWeight: 600 }}>
                      {coupon && couponPct >= referralPct
                        ? t('coupons.couponAppliedShort', { percent: couponPct })
                        : t('payment.referralApplied')} &bull;{' '}
                    </span>
                  )}
                  {isMonthly ? t('payment.totalOver12', { total: (currentPrice * 12).toFixed(0) }) : t('payment.dueToday')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {appliedDiscountPct > 0 && (
                  <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through', marginRight: '8px' }}>
                    ${originalPrice}
                  </span>
                )}
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                  ${currentPrice}
                </span>
                {isMonthly && <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>/mo</span>}
              </div>
            </div>

            {/* ERROR */}
            {checkoutError && (
              <div style={{ padding: '14px 18px', background: '#fef2f2', color: '#991b1b', borderRadius: '12px', marginBottom: '16px', border: '1px solid #fecaca', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>&#9888;</span>
                {checkoutError}
              </div>
            )}

            {/* CHECKOUT BUTTON */}
            <button
              onClick={handleCheckout}
              disabled={processing}
              style={{
                width: '100%',
                padding: '16px',
                background: processing ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontSize: '1.05rem',
                fontWeight: 700,
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.2s ease',
                boxShadow: processing ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
                letterSpacing: '0.01em',
              }}
            >
              {processing ? (
                <>
                  <div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  {t('common.processing')}
                </>
              ) : (
                <>
                  <Lock size={18} /> {t('payment.proceedCheckout')}
                </>
              )}
            </button>

            {/* TRUST BADGES */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Lock size={13} color="#94a3b8" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{t('payment.sslEncrypted')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Shield size={13} color="#94a3b8" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{t('payment.securePayment')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={13} color="#94a3b8" />
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>{t('payment.poweredByStripe')}</span>
              </div>
            </div>

            {/* CANCEL */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                onClick={() => navigate('/client/dashboard')}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
              >
                {t('payment.cancelReturn')}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .pay-options-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
