import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/FormElements';

export default function PaymentPlaceholder() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { price = 1499, iso = 'ISO 9001:2015 (Quality Management)' } = location.state || {};

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', padding: '40px', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', maxWidth: '500px', width: '100%' }}>
        <h2 style={{ marginBottom: '16px' }}>Checkout</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
          Stripe Integration goes here for Application ID: <strong style={{ color: 'var(--color-text-primary)' }}>{applicationId}</strong>
        </p>

        <div style={{ marginBottom: '32px', textAlign: 'left', background: 'var(--color-bg-primary)', padding: '24px', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>Order Summary</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--color-text-primary)' }}>{iso}</span>
            <strong style={{ color: 'var(--color-text-primary)' }}>${price.toLocaleString()}.00</strong>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', margin: '16px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
            <strong style={{ color: 'var(--color-text-primary)' }}>Total Due</strong>
            <strong style={{ color: 'var(--color-accent)' }}>${price.toLocaleString()}.00</strong>
          </div>
        </div>

        <Button onClick={() => navigate('/client/dashboard')} variant="secondary" fullWidth>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
