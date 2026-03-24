import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Button, Select } from '../../components/ui/FormElements';
import { REGIONS, ROLES, ROLE_LABELS, PERMISSIONS, getRolePermissions } from '../../utils/roles';
import { User, Globe, Shield, Settings as SettingsIcon, Check } from 'lucide-react';
import './Settings.css';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'regions', label: 'Regions', icon: Globe },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'general', label: 'General', icon: SettingsIcon },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and platform settings</p>
        </div>
      </div>

      <div className="settings__layout">
        <div className="settings__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings__tab ${activeTab === tab.id ? 'settings__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings__content">
          {activeTab === 'profile' && <ProfileTab user={user} />}
          {activeTab === 'regions' && <RegionsTab />}
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'general' && <GeneralTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ user }) {
  const { updatePassword, supabase } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || user?.name || '',
    company_name: user?.company_name || '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type, text }

  const handleProfileUpdate = async () => {
    setProfileLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.full_name, 
          company_name: formData.company_name 
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Profile updated successfully! Refreshing...' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in both password fields.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    
    setPasswordLoading(true);
    setMessage(null);
    try {
      const { success, error } = await updatePassword(passwordData.newPassword);
      if (!success) throw new Error(error);
      
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update password' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="settings__section">
      <h2 className="settings__section-title">Profile Information</h2>
      <p className="settings__section-desc">Update your account details</p>
      
      {message && (
        <div className="application-form__error" style={{
          backgroundColor: message.type === 'error' ? 'var(--color-bg-error, #fee2e2)' : 'var(--color-bg-success, #dcfce7)',
          color: message.type === 'error' ? 'var(--color-text-error, #b91c1c)' : 'var(--color-text-success, #15803d)',
          border: `1px solid ${message.type === 'error' ? '#fca5a5' : '#86efac'}`,
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          {message.text}
        </div>
      )}

      <div className="settings__form" style={{ marginBottom: '40px' }}>
        <div className="settings__avatar-section">
          <div className="settings__avatar-large">
            {(user?.full_name || user?.name || 'U').charAt(0)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '4px' }}>{user?.full_name || user?.name || 'User'}</span>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>{ROLE_LABELS[user?.role] || 'Role'}</span>
          </div>
        </div>
        <div className="settings__form-grid">
          <Input 
            label="Full Name" 
            id="settings-name" 
            value={formData.full_name} 
            onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
          />
          <Input 
            label="Email" 
            id="settings-email" 
            type="email" 
            value={user?.email || ''} 
            disabled 
          />
          <Input 
            label="Company" 
            id="settings-company" 
            value={formData.company_name} 
            onChange={(e) => setFormData({...formData, company_name: e.target.value})} 
            placeholder="Your company" 
          />
          <Input 
            label="Role" 
            id="settings-role" 
            value={ROLE_LABELS[user?.role] || 'Role'} 
            disabled 
          />
        </div>
        <div className="settings__form-actions">
          <Button variant="primary" size="md" onClick={handleProfileUpdate} loading={profileLoading}>Save Changes</Button>
          <Button variant="ghost" size="md" onClick={() => setFormData({ full_name: user?.full_name || user?.name || '', company_name: user?.company_name || '' })}>Cancel</Button>
        </div>
      </div>

      <h2 className="settings__section-title" style={{ marginTop: '40px', paddingTop: '40px', borderTop: '1px solid var(--border-color, #e5e7eb)' }}>Security</h2>
      <p className="settings__section-desc">Update your password</p>
      
      <div className="settings__form">
        <div className="settings__form-grid">
          <Input 
            label="New Password" 
            id="settings-new-password" 
            type="password" 
            placeholder="Enter new password"
            value={passwordData.newPassword} 
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
          />
          <Input 
            label="Confirm Password" 
            id="settings-confirm-password" 
            type="password" 
            placeholder="Confirm new password"
            value={passwordData.confirmPassword} 
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
          />
        </div>
        <div className="settings__form-actions">
          <Button variant="primary" size="md" onClick={handlePasswordUpdate} loading={passwordLoading}>Update Password</Button>
        </div>
      </div>
    </div>
  );
}

function RegionsTab() {
  return (
    <div className="settings__section">
      <h2 className="settings__section-title">Region Management</h2>
      <p className="settings__section-desc">Configure active regions for your platform</p>
      <div className="settings__regions-list">
        {REGIONS.map((region) => (
          <div key={region.id} className="settings__region-row">
            <div className="settings__region-info">
              <span className="settings__region-emoji">{region.emoji}</span>
              <span className="settings__region-name">{region.label}</span>
            </div>
            <div className="settings__region-toggle">
              <label className="settings__switch">
                <input type="checkbox" defaultChecked />
                <span className="settings__switch-slider" />
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RolesTab() {
  const roleKeys = Object.values(ROLES);
  const permKeys = Object.values(PERMISSIONS);

  return (
    <div className="settings__section">
      <h2 className="settings__section-title">Roles & Permissions</h2>
      <p className="settings__section-desc">View the permission matrix for all roles</p>
      <div className="settings__permissions-table-wrap">
        <table className="settings__permissions-table">
          <thead>
            <tr>
              <th>Permission</th>
              {roleKeys.map(r => <th key={r}>{ROLE_LABELS[r]}</th>)}
            </tr>
          </thead>
          <tbody>
            {permKeys.map(perm => (
              <tr key={perm}>
                <td>{perm.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                {roleKeys.map(role => {
                  const has = getRolePermissions(role).includes(perm);
                  return (
                    <td key={role} className="settings__perm-cell">
                      {has ? <Check size={16} className="settings__perm-check" /> : <span className="settings__perm-dash">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GeneralTab() {
  return (
    <div className="settings__section">
      <h2 className="settings__section-title">General Settings</h2>
      <p className="settings__section-desc">Platform-wide configuration</p>
      <div className="settings__general-items">
        <div className="settings__general-item">
          <div>
            <h3 className="settings__general-label">Platform Name</h3>
            <p className="settings__general-desc">The name displayed across the platform</p>
          </div>
          <Input id="platform-name" defaultValue="Certify.cx™" style={{ maxWidth: 250 }} />
        </div>
        <div className="settings__general-item">
          <div>
            <h3 className="settings__general-label">Email Notifications</h3>
            <p className="settings__general-desc">Receive email alerts for certification updates</p>
          </div>
          <label className="settings__switch">
            <input type="checkbox" defaultChecked />
            <span className="settings__switch-slider" />
          </label>
        </div>
        <div className="settings__general-item">
          <div>
            <h3 className="settings__general-label">Two-Factor Authentication</h3>
            <p className="settings__general-desc">Add an extra layer of account security</p>
          </div>
          <label className="settings__switch">
            <input type="checkbox" />
            <span className="settings__switch-slider" />
          </label>
        </div>
      </div>
    </div>
  );
}
