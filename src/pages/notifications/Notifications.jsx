import { Bell, CheckCircle2 } from 'lucide-react';
import './Notifications.css';

export default function Notifications() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Stay updated on your certification progress</p>
        </div>
      </div>

      <div className="notifications__empty">
        <Bell size={48} color="var(--text-muted)" />
        <h3>No notifications yet</h3>
        <p>You will be notified here when there are updates to your applications, audits, or account.</p>
      </div>
    </div>
  );
}
