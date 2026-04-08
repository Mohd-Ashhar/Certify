import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Bell, Gift, DollarSign, CheckCircle2, Info } from 'lucide-react';
import './Notifications.css';

const ICON_MAP = {
  referral: Gift,
  payout: DollarSign,
  system: Info,
};

export default function Notifications() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('notifications.title')}</h1>
          <p className="page-subtitle">{t('notifications.subtitle')}</p>
        </div>
        {unreadCount > 0 && (
          <button className="notif__mark-all-btn" onClick={markAllRead}>
            <CheckCircle2 size={16} /> {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>{t('notifications.loadingNotifications')}</p>
      ) : notifications.length === 0 ? (
        <div className="notifications__empty">
          <Bell size={48} color="var(--text-muted)" />
          <h3>{t('notifications.noNotifications')}</h3>
          <p>{t('notifications.noNotificationsDesc')}</p>
        </div>
      ) : (
        <div className="notif__list">
          {notifications.map((notif) => {
            const IconComponent = ICON_MAP[notif.type] || Bell;
            return (
              <div
                key={notif.id}
                className={`notif__item ${!notif.read ? 'notif__item--unread' : ''}`}
                onClick={() => !notif.read && markAsRead(notif.id)}
              >
                <div className={`notif__icon notif__icon--${notif.type || 'system'}`}>
                  <IconComponent size={20} />
                </div>
                <div className="notif__content">
                  <div className="notif__title">{notif.title}</div>
                  <div className="notif__message">{notif.message}</div>
                  <div className="notif__time">
                    {new Date(notif.created_at).toLocaleString()}
                  </div>
                </div>
                {!notif.read && <div className="notif__dot" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
