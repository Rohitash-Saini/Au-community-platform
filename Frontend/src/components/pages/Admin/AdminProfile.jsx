import React, { useState, useEffect } from 'react';
import API from '../../../api';
import '../../../styles/AdminStyle/AdminProfile.css';

const AdminProfile = ({ currentUser, setCurrentUser }) => {
  const [profile, setProfile] = useState({
    name: 'Admin',
    email: 'admin@aucommunity.com',
    role: 'Admin',
    bio: 'System Administrator & Portal Overseer at AU Foundation',
    linkedin: '',
    github: '',
    instagram: '',
    profilePicture: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await API.get('/users/profile');
      if (res.data?.user) {
        const u = res.data.user;
        setProfile({
          name: u.name || 'Admin',
          email: u.email || 'admin@aucommunity.com',
          role: u.role || 'Admin',
          bio: u.bio || 'System Administrator & Portal Overseer at AU Foundation',
          linkedin: u.linkedin || '',
          github: u.github || '',
          instagram: u.instagram || '',
          profilePicture: u.profilePicture || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch admin profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePictureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, profilePicture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        name: profile.name,
        bio: profile.bio,
        linkedin: profile.linkedin,
        github: profile.github,
        instagram: profile.instagram,
        profilePicture: profile.profilePicture
      };

      const res = await API.put('/users/profile', payload);
      if (res.data?.user) {
        const u = res.data.user;
        setProfile(prev => ({
          ...prev,
          ...u
        }));

        if (setCurrentUser) {
          setCurrentUser(prev => ({
            ...prev,
            ...u,
            avatar: u.profilePicture || prev.avatar
          }));
        }
        localStorage.setItem('au_user', JSON.stringify(u));
        alert('Admin profile updated successfully!');
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating admin profile:', err);
      alert(err.response?.data?.message || 'Failed to update admin profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-profile-card" style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#64748b' }}><i className="fas fa-spinner fa-spin"></i> Loading admin profile...</p>
      </div>
    );
  }

  return (
    <div className="admin-profile-card">
      {/* Banner */}
      <div className="admin-profile-banner"></div>

      {/* Header Avatar & Action */}
      <div className="admin-avatar-container">
        <div className="admin-main-avatar">
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt={profile.name} />
          ) : (
            profile.name ? profile.name.substring(0, 2).toUpperCase() : 'AD'
          )}
        </div>

        <button 
          className="admin-edit-btn" 
          onClick={() => setIsEditing(!isEditing)}
        >
          <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'}`}></i>
          {isEditing ? 'Cancel Edit' : 'Edit Admin Profile'}
        </button>
      </div>

      {/* Profile Details */}
      <div className="admin-profile-details">
        {!isEditing ? (
          <>
            <h2 className="admin-user-name">{profile.name}</h2>
            <p className="admin-user-headline">
              🛡️ {profile.bio}
            </p>

            <div className="admin-tags-row">
              <span className="admin-tag role">
                <i className="fas fa-shield-alt" style={{ marginRight: '6px' }}></i>
                System Administrator
              </span>

              <span className="admin-tag status">
                <i className="fas fa-check-circle" style={{ marginRight: '6px' }}></i>
                Superuser Active
              </span>
            </div>

            <div className="admin-grid-section">
              <div>
                <div className="admin-box">
                  <h4><i className="fas fa-user-shield" style={{ color: '#4f46e5' }}></i> Administrative Role & Scope</h4>
                  <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                    {profile.bio}
                  </p>
                </div>

                <div className="admin-box">
                  <h4><i className="fas fa-key" style={{ color: '#7c3aed' }}></i> Security & System Permissions</h4>
                  <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.8' }}>
                    <li>Full User Management (Create, Role Change, Status Toggle)</li>
                    <li>Community Post Moderation & Category Management</li>
                    <li>Campus Event Authorization & Moderation</li>
                    <li>Global Announcement Publishing</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="admin-box">
                  <h4><i className="fas fa-link" style={{ color: '#2563eb' }}></i> Contact & Channels</h4>
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px' }}>
                    <i className="fas fa-envelope" style={{ marginRight: '8px', color: '#4f46e5' }}></i>
                    {profile.email}
                  </div>

                  {profile.linkedin && (
                    <a href={profile.linkedin} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f1f5f9', borderRadius: '8px', color: '#1e293b', textDecoration: 'none', fontSize: '13px', marginBottom: '6px' }}>
                      <i className="fab fa-linkedin" style={{ color: '#0a66c2' }}></i> LinkedIn Profile
                    </a>
                  )}

                  {profile.github && (
                    <a href={profile.github} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f1f5f9', borderRadius: '8px', color: '#1e293b', textDecoration: 'none', fontSize: '13px' }}>
                      <i className="fab fa-github" style={{ color: '#0f172a' }}></i> GitHub Profile
                    </a>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* EDIT FORM */
          <form onSubmit={handleSaveProfile} style={{ background: '#f8fafc', padding: '24px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fas fa-user-edit" style={{ color: '#4f46e5' }}></i> Edit Admin Profile
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                <i className="fas fa-camera" style={{ color: '#4f46e5', marginRight: '6px' }}></i> Admin Avatar / Picture (From Computer)
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handlePictureUpload}
                style={{ width: '100%', padding: '8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#334155' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Display Name</label>
              <input 
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Bio / Description</label>
              <textarea
                rows="3"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                style={{ width: '100%', padding: '10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>LinkedIn URL</label>
                <input 
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>GitHub URL</label>
                <input 
                  type="url"
                  placeholder="https://github.com/username"
                  value={profile.github}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                style={{ padding: '10px 20px', background: '#e2e8f0', border: 'none', color: '#334155', borderRadius: '20px', cursor: 'pointer', fontWeight: '600' }}
              >
                Cancel
              </button>

              <button 
                type="submit" 
                disabled={isSaving}
                style={{ padding: '10px 24px', background: '#4f46e5', color: '#ffffff', border: 'none', borderRadius: '20px', fontWeight: '700', cursor: 'pointer' }}
              >
                {isSaving ? 'Saving...' : 'Save Admin Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminProfile;
