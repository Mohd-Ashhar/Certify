import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STAKEHOLDER_TYPES } from '../../utils/stakeholderTypes';
import {
  Link2, Copy, Check, MessageCircle, Mail,
  Award, Briefcase, Gift, Building2, UserCheck, TrendingUp, ExternalLink,
} from 'lucide-react';
import './ShareableLinks.css';

const ICON_MAP = {
  Award, Briefcase, Gift, Building2, UserCheck, TrendingUp,
};

export default function ShareableLinks() {
  const { t } = useTranslation();
  const [copiedId, setCopiedId] = useState(null);
  const baseUrl = window.location.origin;

  const types = Object.values(STAKEHOLDER_TYPES);

  const getLink = (type) => `${baseUrl}/register/${type.id}`;

  const handleCopy = async (type) => {
    const link = getLink(type);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(type.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(type.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleWhatsApp = (type) => {
    const link = getLink(type);
    const article = type.singularTitle === 'Investor' ? 'an' : 'a';
    const text = `${t('admin.joinCertifyCXMsg', { article, type: type.singularTitle })}\n\n${type.description}\n\n${t('admin.registerHere')} ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmail = (type) => {
    const link = getLink(type);
    const article = type.singularTitle === 'Investor' ? 'an' : 'a';
    const subject = `${t('admin.invitationSubject')} ${type.title}`;
    const body = `${t('admin.hello')}\n\n${t('admin.invitationBody', { article, type: type.singularTitle })}\n\n${type.description}\n\n${t('admin.learnMore')}\n${link}\n\n${t('admin.bestRegards')}\n${t('admin.certifyCXTeam')}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handlePreview = (type) => {
    window.open(getLink(type), '_blank');
  };

  return (
    <div className="share-links">
      <div className="share-links__header">
        <div>
          <h1 className="share-links__title">{t('admin.shareableLinks')}</h1>
          <p className="share-links__subtitle">
            {t('admin.shareableLinksDesc')}
          </p>
        </div>
      </div>

      <div className="share-links__grid">
        {types.map((type) => {
          const IconComponent = ICON_MAP[type.icon] || Building2;
          const isCopied = copiedId === type.id;
          const link = getLink(type);

          return (
            <div key={type.id} className="share-links__card">
              <div className="share-links__card-header">
                <div className="share-links__card-icon" style={{ background: `${type.color}18`, color: type.color }}>
                  <IconComponent size={22} />
                </div>
                <div>
                  <h3 className="share-links__card-title">{type.title}</h3>
                  <span className="share-links__card-role">Role: {type.role.replace('_', ' ')}</span>
                </div>
              </div>

              <p className="share-links__card-desc">{type.description}</p>

              <div className="share-links__card-link">
                <Link2 size={14} />
                <span className="share-links__card-url">{link}</span>
              </div>

              <div className="share-links__card-actions">
                <button
                  className={`share-links__action-btn ${isCopied ? 'share-links__action-btn--copied' : ''}`}
                  onClick={() => handleCopy(type)}
                  title="Copy link"
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  {isCopied ? t('common.copied') : t('common.copy')}
                </button>
                <button
                  className="share-links__action-btn share-links__action-btn--whatsapp"
                  onClick={() => handleWhatsApp(type)}
                  title={t('admin.whatsApp')}
                >
                  <MessageCircle size={16} />
                  {t('admin.whatsApp')}
                </button>
                <button
                  className="share-links__action-btn share-links__action-btn--email"
                  onClick={() => handleEmail(type)}
                  title={t('auth.email')}
                >
                  <Mail size={16} />
                  {t('auth.email')}
                </button>
                <button
                  className="share-links__action-btn share-links__action-btn--preview"
                  onClick={() => handlePreview(type)}
                  title={t('admin.preview')}
                >
                  <ExternalLink size={16} />
                  {t('admin.preview')}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
