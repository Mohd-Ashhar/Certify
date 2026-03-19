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
  return (
    <div className="settings__section">
      <h2 className="settings__section-title">Profile Information</h2>
      <p className="settings__section-desc">Update your account details</p>
      <div className="settings__form">
        <div className="settings__avatar-section">
          <div className="settings__avatar-large">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <Button variant="secondary" size="sm">Change Avatar</Button>
        </div>
        <div className="settings__form-grid">
          <Input label="Full Name" id="settings-name" defaultValue={user?.name || ''} />
          <Input label="Email" id="settings-email" type="email" defaultValue={user?.email || ''} />
          <Input label="Company" id="settings-company" defaultValue="" placeholder="Your company" />
          <Select label="Region" id="settings-region" defaultValue={user?.region || ''}>
            {REGIONS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </Select>
        </div>
        <div className="settings__form-actions">
          <Button variant="primary" size="md">Save Changes</Button>
          <Button variant="ghost" size="md">Cancel</Button>
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
