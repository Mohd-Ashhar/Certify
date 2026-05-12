import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Download, Eye, Calendar, AlertCircle, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import './MyCertificates.css';

// SIGNED_URL_TTL — how long a freshly minted download URL stays valid.
// 5 minutes is long enough to click through, short enough to limit risk.
const SIGNED_URL_TTL = 60 * 5;

export default function MyCertificates() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('certificates')
        .select('*')
        .eq('client_id', user.id)
        .order('issued_at', { ascending: false });
      if (cancelled) return;
      if (fetchErr) {
        setError(fetchErr.message);
      } else {
        setCertificates(data || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const open = async (cert, asAttachment = false) => {
    try {
      const { data, error: signErr } = await supabase
        .storage
        .from('certificates')
        .createSignedUrl(cert.storage_path, SIGNED_URL_TTL, {
          download: asAttachment ? `${cert.certificate_number}.pdf` : undefined,
        });
      if (signErr) throw signErr;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to fetch certificate URL:', err);
      alert(t('certificates.fetchError'));
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="my-certificates">
      <header className="my-certificates__header">
        <div className="my-certificates__title-row">
          <Award size={26} className="my-certificates__icon" />
          <div>
            <h1>{t('certificates.title')}</h1>
            <p>{t('certificates.subtitle')}</p>
          </div>
        </div>
      </header>

      {loading && (
        <div className="my-certificates__loading">
          <div className="my-certificates__spinner" />
          <p>{t('certificates.loading')}</p>
        </div>
      )}

      {error && (
        <div className="my-certificates__error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && certificates.length === 0 && (
        <div className="my-certificates__empty">
          <FileText size={36} />
          <h3>{t('certificates.emptyTitle')}</h3>
          <p>{t('certificates.emptyDesc')}</p>
        </div>
      )}

      {!loading && certificates.length > 0 && (
        <ul className="my-certificates__list">
          {certificates.map((cert) => (
            <li key={cert.id} className="cert-card">
              <div className="cert-card__head">
                <div className="cert-card__badge">
                  <Award size={20} />
                </div>
                <div className="cert-card__info">
                  <h3 className="cert-card__standard">{cert.iso_standard}</h3>
                  <p className="cert-card__number">{cert.certificate_number}</p>
                </div>
                <span className={`cert-card__status cert-card__status--${cert.status}`}>
                  {t(`certificates.status.${cert.status}`)}
                </span>
              </div>

              <div className="cert-card__meta">
                <div className="cert-card__meta-item">
                  <Calendar size={14} />
                  <span>{t('certificates.issued')} <strong>{formatDate(cert.issued_at)}</strong></span>
                </div>
                <div className="cert-card__meta-item">
                  <Calendar size={14} />
                  <span>{t('certificates.expires')} <strong>{formatDate(cert.expires_at)}</strong></span>
                </div>
              </div>

              <div className="cert-card__actions">
                <button className="cert-card__btn cert-card__btn--secondary" onClick={() => open(cert, false)}>
                  <Eye size={15} /> {t('certificates.view')}
                </button>
                <button className="cert-card__btn cert-card__btn--primary" onClick={() => open(cert, true)}>
                  <Download size={15} /> {t('certificates.download')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
