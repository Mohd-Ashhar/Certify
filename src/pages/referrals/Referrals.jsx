import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Link2, Copy, Check, Users, DollarSign, UserPlus, Gift } from 'lucide-react';
import './Referrals.css';

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Referral code = first 8 chars of user ID (unique enough, short for sharing)
  const referralCode = user?.id?.slice(0, 8) || '';
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

  const fetchReferrals = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    setReferrals(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchReferrals(); }, [fetchReferrals]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  // Stats
  const totalReferred = referrals.length;
  const signedUp = referrals.filter(r => r.status === 'signed_up' || r.status === 'converted').length;
  const converted = referrals.filter(r => r.status === 'converted').length;
  const totalEarnings = referrals.reduce((sum, r) => sum + (parseFloat(r.commission_amount) || 0), 0);

  const columns = [
    {
      key: 'referred_email',
      label: 'Referred Email',
      render: (val) => val || '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <StatusBadge
          status={val}
          label={val === 'converted' ? 'Converted' : val === 'signed_up' ? 'Signed Up' : 'Pending'}
        />
      ),
    },
    {
      key: 'payment_amount',
      label: 'Sale Amount',
      render: (val) => val ? `$${parseFloat(val).toFixed(2)}` : '—',
    },
    {
      key: 'commission_amount',
      label: 'Your Commission (10%)',
      render: (val) => val && parseFloat(val) > 0 ? `$${parseFloat(val).toFixed(2)}` : '—',
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Referral Program</h1>
          <p className="page-subtitle">Earn 10% commission from every sale through your referral link</p>
        </div>
      </div>

      {/* Stats */}
      <div className="referral-stats">
        <StatCard title="Total Referrals" value={totalReferred} icon={Users} iconColor="#6366f1" />
        <StatCard title="Signed Up" value={signedUp} icon={UserPlus} iconColor="#2563eb" />
        <StatCard title="Converted (Paid)" value={converted} icon={Gift} iconColor="#10b981" />
        <StatCard title="Total Earnings" value={`$${totalEarnings.toFixed(2)}`} icon={DollarSign} iconColor="#f59e0b" />
      </div>

      {/* Referral Link */}
      <div className="referral-link-card">
        <div className="referral-link-card__title">Your Referral Link</div>
        <div className="referral-link-card__row">
          <input
            className="referral-link-card__input"
            value={referralLink}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button className="referral-link-card__btn" onClick={handleCopy}>
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Link</>}
          </button>
        </div>
        <p className="referral-link-card__hint">
          Share this link with potential clients. You earn 10% commission when they complete a payment.
        </p>
      </div>

      {/* How It Works */}
      <div className="referral-section">
        <h3 className="referral-section__title">How It Works</h3>
        <div className="referral-how-it-works">
          <div className="referral-how-step">
            <div className="referral-how-step__num">1</div>
            <div className="referral-how-step__title">Share Your Link</div>
            <div className="referral-how-step__desc">Send your unique referral link to potential clients</div>
          </div>
          <div className="referral-how-step">
            <div className="referral-how-step__num">2</div>
            <div className="referral-how-step__title">They Sign Up</div>
            <div className="referral-how-step__desc">When they register using your link, they're tracked as your referral</div>
          </div>
          <div className="referral-how-step">
            <div className="referral-how-step__num">3</div>
            <div className="referral-how-step__title">They Pay</div>
            <div className="referral-how-step__desc">Once they complete a certification payment, your commission is credited</div>
          </div>
          <div className="referral-how-step">
            <div className="referral-how-step__num">4</div>
            <div className="referral-how-step__title">You Earn 10%</div>
            <div className="referral-how-step__desc">10% of every sale is credited to your referral dashboard</div>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="referral-section">
        <h3 className="referral-section__title">Your Referrals</h3>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading referrals...</p>
        ) : referrals.length === 0 ? (
          <div className="referral-empty">
            <div className="referral-empty__icon"><Link2 size={40} /></div>
            <p>No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <DataTable columns={columns} data={referrals} emptyMessage="No referrals yet." />
        )}
      </div>
    </div>
  );
}
