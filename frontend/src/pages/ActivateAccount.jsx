import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import icons from '../components/Icons';
import Toast from '../components/Toast';

function ActivateAccount() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Request, 2: Verify, 3: Set Password
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/request-otp', { identifier });
      setToast({ message: res.data.message, type: 'success' });
      setStep(2);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to send OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { identifier, otp });
      setToast({ message: res.data.message, type: 'success' });
      setStep(3);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Invalid OTP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/set-password', { identifier, newPassword });
      setToast({ message: 'Account activated successfully! Redirecting to login...', type: 'success' });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to set password', type: 'error' });
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h2 style={{ marginTop: 'var(--space-md)' }}>Activate Account</h2>
          <p style={{ fontSize: '0.85rem' }}>Step {step} of 3: {step === 1 ? 'Verify Identity' : step === 2 ? 'Verify OTP' : 'Secure Account'}</p>
        </div>

        {step === 1 && (
          <form className="login-form stagger-fade-in" onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="form-label">Roll Number / Faculty ID</label>
              <input
                className="form-input"
                placeholder="Enter your registered ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Processing...' : 'Send Activation OTP'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/login')} style={{ marginTop: '10px' }}>
              Back to Login
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="login-form stagger-fade-in" onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label">Enter 6-Digit OTP</label>
              <input
                className="form-input"
                placeholder="Enter OTP sent to email"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem' }}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(1)} style={{ marginTop: '10px' }}>
              Change ID
            </button>
          </form>
        )}

        {step === 3 && (
          <form className="login-form stagger-fade-in" onSubmit={handleSetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Choose a strong password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Activating...' : 'Activate & Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ActivateAccount;
