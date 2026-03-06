import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import icons from '../components/Icons';
import Toast from '../components/Toast';

function ResetPassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      
      setToast({ message: 'Password updated! Welcome aboard.', type: 'success' });
      
      // Get the updated user info to make sure isFirstLogin is false in local storage
      const profileRes = await api.get('/auth/profile');
      localStorage.setItem('user', JSON.stringify(profileRes.data));

      setTimeout(() => {
        const user = profileRes.data;
        switch (user.role) {
          case 'ADMIN': navigate('/admin'); break;
          case 'FACULTY': navigate('/faculty'); break;
          case 'STUDENT': navigate('/student'); break;
          default: navigate('/');
        }
      }, 1500);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="toast-container">
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>

      <div className="login-card animate-slide-up" style={{ maxWidth: '400px' }}>
        <div className="login-brand">
          <div className="login-brand-icon" style={{ background: 'var(--accent-sky)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h2 style={{ marginTop: 'var(--space-md)' }}>Secure Your Account</h2>
          <p style={{ fontSize: '0.85rem' }}>This is your first login. Please set a new permanent password.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} style={{ marginTop: 'var(--space-xl)' }}>
          <div className="form-group">
            <label className="form-label">Current / Temporary Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 'var(--space-md)' }}>
            {loading ? 'Updating...' : 'Set Permanent Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
