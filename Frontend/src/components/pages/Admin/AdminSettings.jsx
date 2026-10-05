import React, { useState } from 'react';
import '../../../styles/AdminStyle/AdminSettings.css';

function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    platformName: 'AU Foundation',
    supportEmail: 'support@aucommunity.com',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      alert('Settings saved successfully!');
    }, 800);
  };

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="settings-page">
      <div className="set-header">
        <div>
          <h1>Platform Settings</h1>
          <p>Configure global application settings and preferences</p>
        </div>
        <button className="btn-save-settings" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><i className="fas fa-spinner fa-spin"></i> Saving...</>
          ) : (
            <><i className="fas fa-save"></i> Save Changes</>
          )}
        </button>
      </div>
      
      <div className="set-container">
        <div className="set-nav">
          <div 
            className={`set-nav-item ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="fas fa-cog"></i> General
          </div>
          <div 
            className={`set-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <i className="fas fa-shield-alt"></i> Security
          </div>
          <div 
            className={`set-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <i className="fas fa-bell"></i> Notifications
          </div>
        </div>

        <div className="set-content-card">
          {activeTab === 'general' && (
            <div>
              <h2>General Settings</h2>
              
              <div className="set-form-group">
                <label>Platform Name</label>
                <input 
                  type="text" 
                  value={settings.platformName} 
                  onChange={(e) => setSettings({...settings, platformName: e.target.value})} 
                />
              </div>
              
              <div className="set-form-group">
                <label>Support Contact Email</label>
                <input 
                  type="email" 
                  value={settings.supportEmail} 
                  onChange={(e) => setSettings({...settings, supportEmail: e.target.value})} 
                />
              </div>

              <h3 style={{marginTop: '30px', marginBottom: '16px', fontSize: '16px', color: '#1e293b'}}>System Toggles</h3>
              
              <div className="set-toggle-group">
                <div className="set-toggle-info">
                  <strong>Maintenance Mode</strong>
                  <span>Put the platform in maintenance mode. Only admins will be able to log in.</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={settings.maintenanceMode} onChange={() => handleToggle('maintenanceMode')} />
                  <span className="slider"></span>
                </label>
              </div>
              
              <div className="set-toggle-group">
                <div className="set-toggle-info">
                  <strong>Allow New Registrations</strong>
                  <span>Allow new users to sign up for an account.</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={settings.allowRegistrations} onChange={() => handleToggle('allowRegistrations')} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2>Security Settings</h2>
              
              <div className="set-toggle-group">
                <div className="set-toggle-info">
                  <strong>Require Email Verification</strong>
                  <span>Users must verify their email address before logging in.</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={settings.requireEmailVerification} onChange={() => handleToggle('requireEmailVerification')} />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2>Notification Preferences</h2>
              <p style={{color: '#64748b', fontSize: '14px'}}>System email templates and push notifications will be configured here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSettings;
