import { useState } from 'react';
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
    const text = `Join CertifyCX as ${type.singularTitle === 'Investor' ? 'an' : 'a'} ${type.singularTitle}!\n\n${type.description}\n\nRegister here: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmail = (type) => {
    const link = getLink(type);
    const subject = `Invitation to join CertifyCX — ${type.title}`;
    const body = `Hello,\n\nYou are invited to join CertifyCX as ${type.singularTitle === 'Investor' ? 'an' : 'a'} ${type.singularTitle}.\n\n${type.description}\n\nYou can register and learn more about the benefits, rules & regulations here:\n${link}\n\nBest regards,\nCertifyCX Team`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handlePreview = (type) => {
    window.open(getLink(type), '_blank');
  };

  return (
    <div className="share-links">
      <div className="share-links__header">
        <div>
          <h1 className="share-links__title">Shareable Links</h1>
          <p className="share-links__subtitle">
            Share registration links with stakeholders. Each link includes benefits, rules &amp; regulations for self-registration.
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
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  className="share-links__action-btn share-links__action-btn--whatsapp"
                  onClick={() => handleWhatsApp(type)}
                  title="Share via WhatsApp"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </button>
                <button
                  className="share-links__action-btn share-links__action-btn--email"
                  onClick={() => handleEmail(type)}
                  title="Share via Email"
                >
                  <Mail size={16} />
                  Email
                </button>
                <button
                  className="share-links__action-btn share-links__action-btn--preview"
                  onClick={() => handlePreview(type)}
                  title="Preview link"
                >
                  <ExternalLink size={16} />
                  Preview
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
