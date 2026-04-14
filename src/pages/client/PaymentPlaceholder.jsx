import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePrice, getCountryTier, getFullPrice, getMonthlyPrice } from '../../utils/pricing';
import { Lock, Shield, CreditCard, CalendarClock, CheckCircle2, Sparkles, Tag } from 'lucide-react';

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

  // Check if client is eligible for referral discount
  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/check-referral-discount', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: user.id }),
    })
      .then(r => r.json())
      .then(data => { if (data.hasDiscount) setHasReferralDiscount(true); })
      .catch(() => {});
  }, [user?.id]);

  const countryTier = getCountryTier(user?.country);
  const isoName = application?.recommended_iso || 'ISO 9001:2015 (Quality Management)';
  const fullPrice = getFullPrice(countryTier);
  const monthlyPrice = getMonthlyPrice(countryTier);
  const originalPrice = isMonthly ? monthlyPrice : fullPrice;
  const discountedPrice = hasReferralDiscount ? Math.round(originalPrice * 0.9 * 100) / 100 : originalPrice;
  const currentPrice = discountedPrice;

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
          tier: 'START',
          isMonthly,
          price: originalPrice,
          applicationId,
          clientId: user?.id
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

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', marginBottom: '16px', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)' }}>
            <CreditCard size={26} color="white" />
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>{t('payment.completeOrder')}</h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>{t('payment.secureISO')}</p>
        </div>

        {/* REFERRAL DISCOUNT BANNER */}
        {hasReferralDiscount && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', border: '1px solid #6ee7b7', borderRadius: '14px', marginBottom: '20px' }}>
            <Tag size={20} color="#059669" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: '#065f46', fontSize: '0.95rem' }}>{t('payment.referralDiscount')}</p>
              <p style={{ margin: 0, color: '#047857', fontSize: '0.82rem' }}>{t('payment.referralDiscountDesc')}</p>
            </div>
          </div>
        )}

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

            {/* PAYMENT OPTIONS */}
            <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 16px 0' }}>{t('payment.choosePayment')}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '28px' }}>

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
                  {hasReferralDiscount ? (
                    <>
                      <span style={{ textDecoration: 'line-through', fontSize: '1.1rem', color: '#94a3b8', marginRight: '6px' }}>${fullPrice}</span>
                      ${Math.round(fullPrice * 0.9 * 100) / 100}
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

              {/* 12-MONTH RECURRING */}
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
                  {hasReferralDiscount ? (
                    <>
                      <span style={{ textDecoration: 'line-through', fontSize: '1.1rem', color: '#94a3b8', marginRight: '6px' }}>${monthlyPrice}</span>
                      ${Math.round(monthlyPrice * 0.9 * 100) / 100}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#64748b' }}>/mo</span>
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
            </div>

            {/* DIVIDER */}
            <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #e2e8f0 20%, #e2e8f0 80%, transparent)', margin: '0 0 24px 0' }} />

            {/* TOTAL */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '20px', background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div>
                <p style={{ margin: '0 0 2px 0', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {isMonthly ? t('payment.monthlyPayment') : t('payment.totalAmount')}
                </p>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  {hasReferralDiscount && <span style={{ color: '#059669', fontWeight: 600 }}>{t('payment.referralApplied')} &bull; </span>}
                  {isMonthly ? t('payment.totalOver12', { total: (currentPrice * 12).toFixed(0) }) : t('payment.dueToday')}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {hasReferralDiscount && (
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
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
