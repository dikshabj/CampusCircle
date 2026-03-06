import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import icons from './Icons';

function ProfilePopup({ onClose }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [editing, setEditing] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    bio: user.bio || ''
  });

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState('');
  const popupRef = useRef(null);

  useEffect(() => {
    fetchLatestProfile();
  }, []);

  const fetchLatestProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      setUser(res.data);
      setFormData({
        name: res.data.name || '',
        phone: res.data.phone || '',
        bio: res.data.bio || ''
      });
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to sync profile', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.patch('/auth/profile', formData);
      const updatedUser = res.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await api.post('/users/change-password', {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      setMessage('Password changed successfully');
      setChangingPass(false);
      setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const getRoleBadge = (role) => {
    const map = {
      ADMIN: { bg: 'rgba(239,68,68,0.15)', color: 'var(--primary-400)', label: 'Administrator' },
      FACULTY: { bg: 'rgba(59,130,246,0.15)', color: 'var(--accent-sky)', label: 'Faculty' },
      STUDENT: { bg: 'rgba(52,211,153,0.15)', color: 'var(--accent-emerald)', label: 'Student' },
    };
    const style = map[role] || map.STUDENT;
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        background: style.bg,
        color: style.color,
        fontSize: '0.72rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div className="modal-backdrop" style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(8px)', zIndex: 9999 }}>
      <div 
        ref={popupRef} 
        className="modal animate-slide-up" 
        style={{ 
          maxWidth: '440px', 
          background: 'rgba(30,30,42,0.98)', 
          border: '1px solid rgba(255,255,255,0.08)',
          padding: 0,
          overflowY: 'auto',
          maxHeight: '90vh',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        {/* Banner */}
        <div style={{ height: '90px', background: 'var(--gradient-primary)', opacity: 0.25, filter: 'blur(50px)' }}></div>
        <div style={{ height: '90px', background: 'var(--gradient-primary)', position: 'absolute', top: 0, left: 0, right: 0, opacity: 0.1 }}></div>

        <div style={{ padding: 'var(--space-xl)', marginTop: '-50px', position: 'relative' }}>
          {/* Avatar + Close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-lg)' }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '24px',
              border: '4px solid rgba(30,30,42,1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'white',
              boxShadow: 'var(--shadow-xl)',
              background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-hover) 100%)',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05) rotate(-2deg)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
              {user.name?.[0]?.toUpperCase()}
            </div>
            <button className="btn-icon btn-ghost" onClick={onClose} style={{ marginBottom: '45px', background: 'rgba(255,255,255,0.03)' }}>{icons.close}</button>
          </div>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{user.name}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {getRoleBadge(user.role)}
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• Joined {new Date(user.createdAt).getFullYear()}</span>
            </div>
          </div>

          {fetching ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              
              <div className="form-group">
                <label className="form-label">Biography</label>
                {editing ? (
                  <textarea 
                    className="form-input" 
                    value={formData.bio} 
                    onChange={e=>setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    style={{ minHeight: '80px', fontSize: '0.85rem' }}
                  />
                ) : (
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontStyle: formData.bio ? 'normal' : 'italic' }}>
                    {formData.bio || 'No biography added yet.'}
                  </p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email || '—'}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  {editing ? (
                    <input 
                      className="form-input" 
                      value={formData.phone} 
                      onChange={e=>setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter mobile number"
                    />
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formData.phone || '—'}</div>
                  )}
                </div>
              </div>

              {user.batch && (
                 <div className="form-group" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label className="form-label" style={{ marginBottom: '8px', opacity: 0.6 }}>Academic Batch</label>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.82rem' }}>
                      <span><strong>{user.batch.branch}</strong></span>
                      <span>Sem <strong>{user.batch.semester}</strong></span>
                      <span>Sec <strong>{user.batch.section}</strong></span>
                    </div>
                 </div>
              )}

              {/* Password Section */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 'var(--space-md)' }}>
                {changingPass ? (
                  <form onSubmit={handlePasswordChange} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={passData.currentPassword} 
                        onChange={e=>setPassData({...passData, currentPassword: e.target.value})} 
                        required 
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          value={passData.newPassword} 
                          onChange={e=>setPassData({...passData, newPassword: e.target.value})} 
                          required 
                          minLength={6}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Confirm New</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          value={passData.confirmPassword} 
                          onChange={e=>setPassData({...passData, confirmPassword: e.target.value})} 
                          required 
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>Update Password</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setChangingPass(false)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => setChangingPass(true)} 
                    style={{ padding: 0, fontSize: '0.82rem', gap: '6px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Change Account Password
                  </button>
                )}
              </div>
            </div>
          )}

          {message && (
            <div style={{ 
              marginTop: 'var(--space-lg)', 
              padding: '10px', 
              borderRadius: 'var(--radius-md)', 
              background: message.includes('success') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: message.includes('success') ? 'var(--accent-emerald)' : 'var(--primary-400)',
              fontSize: '0.82rem', textAlign: 'center'
            }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {editing ? (
                <>
                  <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>setEditing(false)}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={()=>setEditing(true)} style={{ gap: '8px' }}>
                  {icons.edit} Edit Profile
                </button>
              )}
            </div>
            
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={handleLogout}
              style={{ color: 'var(--primary-400)', gap: '6px', fontWeight: 700 }}
            >
              {icons.logout} Sign Out
            </button>
          </div>
          <div style={{ height: '20px' }}></div> {/* Extra bottom space */}
        </div>
      </div>
    </div>
  );
}

export default ProfilePopup;
