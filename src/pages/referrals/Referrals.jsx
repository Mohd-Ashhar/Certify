import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import { Link2, Copy, Check, Users, DollarSign, UserPlus, Gift } from 'lucide-react';
import './Referrals.css';

export default function Referrals() {
  const { user } = useAuth();
  const { t } = useTranslation();
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
      label: t('referrals.referredEmail'),
      render: (val) => val || '—',
    },
    {
      key: 'status',
      label: t('dashboard.status'),
      render: (val) => (
        <StatusBadge
          status={val}
          label={val === 'converted' ? t('settings.converted') : val === 'signed_up' ? t('referrals.signedUp') : t('admin.pending')}
        />
      ),
    },
    {
      key: 'payment_amount',
      label: t('settings.saleAmount'),
      render: (val) => val ? `$${parseFloat(val).toFixed(2)}` : '—',
    },
    {
      key: 'commission_amount',
      label: t('referrals.yourCommission'),
      render: (val) => val && parseFloat(val) > 0 ? `$${parseFloat(val).toFixed(2)}` : '—',
    },
    {
      key: 'payout_status',
      label: t('referrals.payout'),
      render: (val, row) => row.status === 'converted' ? (
        <StatusBadge status={val || 'pending'} label={val === 'paid' ? t('settings.paid') : t('common.processing')} />
      ) : '—',
    },
    {
      key: 'created_at',
      label: t('dashboard.date'),
      render: (val) => val ? new Date(val).toLocaleDateString() : '—',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('referrals.title')}</h1>
          <p className="page-subtitle">{t('referrals.subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="referral-stats">
        <StatCard title={t('referrals.totalReferrals')} value={totalReferred} icon={Users} iconColor="#6366f1" />
        <StatCard title={t('referrals.signedUp')} value={signedUp} icon={UserPlus} iconColor="#2563eb" />
        <StatCard title={t('referrals.convertedPaid')} value={converted} icon={Gift} iconColor="#10b981" />
        <StatCard title={t('referrals.totalEarnings')} value={`$${totalEarnings.toFixed(2)}`} icon={DollarSign} iconColor="#f59e0b" />
      </div>

      {/* Referral Link */}
      <div className="referral-link-card">
        <div className="referral-link-card__title">{t('referrals.yourReferralLink')}</div>
        <div className="referral-link-card__row">
          <input
            className="referral-link-card__input"
            value={referralLink}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button className="referral-link-card__btn" onClick={handleCopy}>
            {copied ? <><Check size={16} /> {t('common.copied')}</> : <><Copy size={16} /> {t('referrals.copyLink')}</>}
          </button>
        </div>
        <p className="referral-link-card__hint">
          {t('referrals.shareLinkHint')}
        </p>
      </div>

      {/* How It Works */}
      <div className="referral-section">
        <h3 className="referral-section__title">{t('referrals.howItWorks')}</h3>
        <div className="referral-how-it-works">
          <div className="referral-how-step">
            <div className="referral-how-step__num">1</div>
            <div className="referral-how-step__title">{t('referrals.step1Title')}</div>
            <div className="referral-how-step__desc">{t('referrals.step1Desc')}</div>
          </div>
          <div className="referral-how-step">
            <div className="referral-how-step__num">2</div>
            <div className="referral-how-step__title">{t('referrals.step2Title')}</div>
            <div className="referral-how-step__desc">{t('referrals.step2Desc')}</div>
          </div>
          <div className="referral-how-step">
            <div className="referral-how-step__num">3</div>
            <div className="referral-how-step__title">{t('referrals.step3Title')}</div>
            <div className="referral-how-step__desc">{t('referrals.step3Desc')}</div>
          </div>
          <div className="referral-how-step">
            <div className="referral-how-step__num">4</div>
            <div className="referral-how-step__title">{t('referrals.step4Title')}</div>
            <div className="referral-how-step__desc">{t('referrals.step4Desc')}</div>
          </div>
        </div>
      </div>

      {/* Referrals Table */}
      <div className="referral-section">
        <h3 className="referral-section__title">{t('referrals.yourReferrals')}</h3>
        {loading ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('referrals.loadingReferrals')}</p>
        ) : referrals.length === 0 ? (
          <div className="referral-empty">
            <div className="referral-empty__icon"><Link2 size={40} /></div>
            <p>{t('referrals.noReferrals')}</p>
          </div>
        ) : (
          <DataTable columns={columns} data={referrals} emptyMessage={t('referrals.noReferralsShort')} />
        )}
      </div>
    </div>
  );
}
