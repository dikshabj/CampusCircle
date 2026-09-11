import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import icons from '../components/Icons';

function Login() {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password: password.trim(),
        loginType,
      });

      const { access_token, user, forcePasswordChange } = response.data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      if (forcePasswordChange) {
        navigate('/reset-password');
        return;
      }

      switch (user.role) {
        case 'ADMIN': navigate('/admin'); break;
        case 'FACULTY': navigate('/faculty'); break;
        case 'STUDENT': navigate('/student'); break;
        default: navigate('/');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      
      if (message.includes('not activated')) {
        setTimeout(() => navigate('/activate'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholder = () => {
    switch (loginType) {
      case 'student': return 'Enter Email or Roll Number';
      case 'faculty': return 'Enter Email or Faculty ID';
      case 'admin': return 'Enter your Email';
      default: return '';
    }
  };

  const getLabel = () => {
    switch (loginType) {
      case 'student': return 'Email or Roll Number';
      case 'faculty': return 'Email or Faculty ID';
      case 'admin': return 'Email';
      default: return '';
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-slide-up">
        <div className="login-brand" style={{ marginBottom: 'var(--space-md)' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: 0 }}><span>Campus</span>Feed</h1>
        </div>

        {/* Role Tabs */}
        <div className="role-tabs">
          {['student', 'faculty', 'admin'].map((type) => (
            <button
              key={type}
              type="button"
              className={`role-tab ${loginType === type ? 'active' : ''}`}
              onClick={() => { setLoginType(type); setIdentifier(''); setError(''); }}
            >
              {type}
            </button>
          ))}
        </div>

        <form className="login-form stagger-fade-in" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{getLabel()}</label>
            <input
              className="form-input"
              type={loginType === 'admin' ? 'email' : 'text'}
              placeholder={getPlaceholder()}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--primary-400)',
              fontSize: '0.82rem',
            }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
          <button 
            type="button" 
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/activate')}
            style={{ fontSize: '0.8rem', color: 'var(--accent-sky)' }}
          >
            First time user? Activate Account
          </button>
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: 'var(--space-xl)',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
        }}>
          Accounts are created by your admin.<br />
          Contact your department for access.
        </p>
      </div>
    </div>
  );
}

export default Login;
