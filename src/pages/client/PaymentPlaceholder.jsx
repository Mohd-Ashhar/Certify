import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePrice, getCountryTier } from '../../utils/pricing';
import { Button } from '../../components/ui/FormElements';
import { Lock } from 'lucide-react';

const TIERS = ['START', 'POPULAR', 'CORPORATE'];

export default function PaymentPlaceholder() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [activeTier, setActiveTier] = useState('START');

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
        if (isMounted) {
          setApplication(data);
          if (data.selected_package) setActiveTier(data.selected_package.toUpperCase());
        }
      } catch (err) {
        console.error('Failed to fetch application:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (applicationId) {
      fetchApp();
    }

    return () => { isMounted = false; };
  }, [applicationId]);

  const handleCheckout = async () => {
    if (!application) return;
    setProcessing(true);
    setCheckoutError(null);

    try {
      const isoName = application.recommended_iso || 'ISO 9001:2015 (Quality Management)';
      const price = calculatePrice(isoName, activeTier, isMonthly, getCountryTier(user?.country));

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isoName,
          tier: activeTier,
          isMonthly,
          price,
          applicationId,
          clientId: user?.id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize checkout');
      }

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
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(37,99,235,0.2)', borderTopColor: 'var(--primary-color, #2563eb)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--text-light, #6b7280)', fontWeight: 500 }}>Loading order details...</p>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ marginBottom: '16px', color: 'var(--text-color, #111827)' }}>Application not found.</p>
        <Button onClick={() => navigate('/client/dashboard')}>Back to Dashboard</Button>
      </div>
    );
  }

  const isoName = application.recommended_iso || 'ISO 9001:2015 (Quality Management)';
  const countryTier = getCountryTier(user?.country);
  const currentPrice = calculatePrice(isoName, activeTier, isMonthly, countryTier);

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '4vh', minHeight: '80vh' }}>
      <div style={{ padding: '40px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color, #e5e7eb)', maxWidth: '680px', width: '100%', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-color, #111827)' }}>Checkout Summary</h2>
          <p style={{ color: 'var(--text-light, #6b7280)', fontSize: '1rem', margin: 0 }}>Review your certification package</p>
        </div>

        {/* DETAILS SECTION */}
        <div style={{ marginBottom: '32px', background: 'var(--bg-light, #f8fafc)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-light, #e2e8f0)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-light, #64748b)', fontWeight: 500, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard</span>
            <strong style={{ color: 'var(--text-color, #0f172a)', fontSize: '0.95rem' }}>{isoName}</strong>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', margin: '16px 0' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-light, #64748b)', fontWeight: 500, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Selected Package</span>
            <span style={{ background: 'var(--primary-color, #2563eb)', color: 'white', padding: '4px 12px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.025em' }}>
              {activeTier}
            </span>
          </div>
        </div>

        {/* TIER SELECTOR */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-color, #111827)' }}>Choose Your Plan</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {TIERS.map((tier) => {
              const isActive = activeTier === tier;
              const oneTimePrice = calculatePrice(isoName, tier, false, countryTier);
              const monthlyPrice = calculatePrice(isoName, tier, true, countryTier);
              return (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  style={{
                    textAlign: 'center',
                    padding: '20px 12px',
                    border: isActive ? '2.5px solid var(--primary-color, #2563eb)' : '2px solid var(--border-color, #e2e8f0)',
                    borderRadius: '12px',
                    background: isActive ? 'rgba(37,99,235,0.04)' : '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    opacity: isActive ? 1 : 0.75,
                    transform: isActive ? 'translateY(-2px)' : 'none',
                    boxShadow: isActive ? '0 4px 12px rgba(37, 99, 235, 0.15)' : 'none',
                  }}
                >
                  {tier === 'POPULAR' && (
                    <span style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      color: 'white',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}>
                      Recommended
                    </span>
                  )}
                  {isActive && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-color, #2563eb)', width: '1.75rem', height: '1.75rem', borderBottomLeftRadius: '10px', borderTopRightRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem' }}>
                      ✓
                    </div>
                  )}
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, color: isActive ? 'var(--primary-color, #2563eb)' : 'var(--text-color, #334155)' }}>
                    {tier}
                  </h4>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color, #0f172a)', marginBottom: '4px' }}>
                    ${isMonthly ? monthlyPrice : oneTimePrice}
                    {isMonthly && <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-light, #64748b)' }}>/mo</span>}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-light, #94a3b8)' }}>
                    {isMonthly ? `$${oneTimePrice} one-time` : `$${monthlyPrice}/mo`}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* BILLING CYCLE SELECTION */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text-color, #111827)' }}>Choose Billing Cycle</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>

            <button
              onClick={() => setIsMonthly(false)}
              style={{
                textAlign: 'left',
                padding: '20px',
                border: !isMonthly ? '2px solid var(--primary-color, #2563eb)' : '2px solid var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                background: !isMonthly ? 'rgba(37,99,235,0.04)' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                opacity: !isMonthly ? 1 : 0.7,
                transform: !isMonthly ? 'translateY(-2px)' : 'none',
                boxShadow: !isMonthly ? '0 4px 6px -1px rgba(37, 99, 235, 0.1)' : 'none'
              }}
            >
              {!isMonthly && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-color, #2563eb)', width: '2rem', height: '2rem', borderBottomLeftRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  ✓
                </div>
              )}
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: !isMonthly ? 700 : 500, color: !isMonthly ? 'var(--primary-color, #2563eb)' : 'var(--text-light, #64748b)' }}>Full Payment</h4>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>${calculatePrice(isoName, activeTier, false, countryTier)}</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-light, #64748b)' }}>One-time payment</p>
            </button>

            <button
              onClick={() => setIsMonthly(true)}
              style={{
                textAlign: 'left',
                padding: '20px',
                border: isMonthly ? '2px solid var(--primary-color, #2563eb)' : '2px solid var(--border-color, #e2e8f0)',
                borderRadius: '12px',
                background: isMonthly ? 'rgba(37,99,235,0.04)' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                opacity: isMonthly ? 1 : 0.7,
                transform: isMonthly ? 'translateY(-2px)' : 'none',
                boxShadow: isMonthly ? '0 4px 6px -1px rgba(37, 99, 235, 0.1)' : 'none'
              }}
            >
              {isMonthly && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-color, #2563eb)', width: '2rem', height: '2rem', borderBottomLeftRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  ✓
                </div>
              )}
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: isMonthly ? 700 : 500, color: isMonthly ? 'var(--primary-color, #2563eb)' : 'var(--text-light, #64748b)' }}>12-Month Commitment</h4>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>${calculatePrice(isoName, activeTier, true, countryTier)} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-light, #64748b)' }}>/mo</span></div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-light, #64748b)' }}>12-month recurring payment</p>
            </button>

          </div>
        </div>

        {/* TOTAL AMOUNT INFO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-light, #64748b)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Total Amount</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-light, #94a3b8)' }}>Due today</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: 'var(--text-color, #0f172a)', lineHeight: 1 }}>
            ${currentPrice.toLocaleString()}<span style={{ fontSize: '1rem', color: 'var(--text-light, #64748b)', fontWeight: 500 }}>{isMonthly ? '/mo' : ''}</span>
          </h2>
        </div>

        {/* CHECKOUT ACTION */}
        {checkoutError && (
          <div className="alert alert-danger mb-4" style={{ padding: '12px 16px', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', border: '1px solid #fecaca', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '8px', fontSize: '1.25rem' }}>⚠</span>
            {checkoutError}
          </div>
        )}

        <Button
          onClick={handleCheckout}
          disabled={processing}
          className="w-full"
          size="lg"
          style={{ width: '100%', marginBottom: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', fontSize: '1.05rem', fontWeight: 600, background: 'var(--primary-color, #2563eb)' }}
        >
          {processing ? 'Processing Secure Session...' : (
            <>
              <Lock size={18} /> Proceed to Secure Checkout
            </>
          )}
        </Button>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/client/dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--text-light, #6b7280)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'underline' }}
          >
            Cancel and return to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
