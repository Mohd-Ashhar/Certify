import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/FormElements';

export default function PaymentPlaceholder() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', maxWidth: '500px', width: '100%' }}>
        <h2 style={{ marginBottom: '16px' }}>Checkout</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          Stripe Integration goes here for Application ID: <strong style={{ color: 'var(--text-color)' }}>{applicationId}</strong>
        </p>
        <Button onClick={() => navigate('/client/dashboard')} variant="secondary">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
