import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { calculatePrice } from '../../utils/pricing';
import { Button } from '../../components/ui/FormElements';
import { Lock } from 'lucide-react';

export default function PaymentPlaceholder() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isMonthly, setIsMonthly] = useState(false); // Default to one-time

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
    
    if (applicationId) {
      fetchApp();
    }
    
    return () => { isMounted = false; };
  }, [applicationId]);

  const handleCheckout = async () => {
    if (!application) return;
    setProcessing(true);
    
    try {
      const isoName = application.recommended_iso || 'ISO 9001:2015 (Quality Management)';
      const tier = application.selected_package ? application.selected_package.toUpperCase() : 'START';
      const price = calculatePrice(isoName, tier, isMonthly);
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isoName,
          tier,
          isMonthly,
          price,
          applicationId,
          clientId: user?.id
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Error initiating checkout. Please try again.');
    } finally {
      if (isMounted) {
         setProcessing(false);
      }
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
  const rawTier = application.selected_package ? application.selected_package.replace(/_/g, ' ').toUpperCase() : 'STANDARD';
  const tierForCalc = application.selected_package ? application.selected_package.toUpperCase() : 'START';

  const priceOptions = {
    oneTime: calculatePrice(isoName, tierForCalc, false),
    monthly: calculatePrice(isoName, tierForCalc, true)
  };

  const currentPrice = isMonthly ? priceOptions.monthly : priceOptions.oneTime;

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '4vh', minHeight: '80vh' }}>
      <div style={{ padding: '40px', background: 'white', borderRadius: '16px', border: '1px solid var(--border-color, #e5e7eb)', maxWidth: '600px', width: '100%', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)' }}>
        
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
              {rawTier}
            </span>
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
                border: `2px solid ${!isMonthly ? 'var(--primary-color, #2563eb)' : 'var(--border-color, #e2e8f0)'}`,
                borderRadius: '12px', 
                background: !isMonthly ? 'rgba(37,99,235,0.03)' : 'white', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {!isMonthly && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-color, #2563eb)', width: '2rem', height: '2rem', borderBottomLeftRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  ✓
                </div>
              )}
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: !isMonthly ? 700 : 500, color: !isMonthly ? 'var(--primary-color, #2563eb)' : 'var(--text-color, #334155)' }}>Pay in Full</h4>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>${priceOptions.oneTime}</div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-light, #64748b)' }}>One-time payment</p>
            </button>
            
            <button 
              onClick={() => setIsMonthly(true)}
              style={{
                textAlign: 'left',
                padding: '20px', 
                border: `2px solid ${isMonthly ? 'var(--primary-color, #2563eb)' : 'var(--border-color, #e2e8f0)'}`,
                borderRadius: '12px', 
                background: isMonthly ? 'rgba(37,99,235,0.03)' : 'white', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {isMonthly && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--primary-color, #2563eb)', width: '2rem', height: '2rem', borderBottomLeftRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  ✓
                </div>
              )}
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: isMonthly ? 700 : 500, color: isMonthly ? 'var(--primary-color, #2563eb)' : 'var(--text-color, #334155)' }}>Pay Monthly</h4>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-color, #0f172a)' }}>${priceOptions.monthly} <span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'var(--text-light, #64748b)' }}>/mo</span></div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-light, #64748b)' }}>12 installments</p>
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
