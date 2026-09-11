import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import icons from './Icons';
import ProfilePopup from './ProfilePopup';
import NotificationBell from './NotificationBell';

function DashboardLayout({ role, navItems }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};
  const [showProfile, setShowProfile] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Initialize theme on mount and handle state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN': return 'Admin Panel';
      case 'FACULTY': return 'Faculty Dashboard';
      case 'STUDENT': return 'Student Portal';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="app-layout">
      <div 
        className={`drawer-overlay ${isMenuOpen ? 'show' : ''}`} 
        onClick={() => setIsMenuOpen(false)}
      />

      <header className="top-navbar">
        <button 
          className="navbar-toggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          style={{ visibility: isMenuOpen ? 'hidden' : 'visible' }}
        >
          {icons.menu}
        </button>

        {!isMenuOpen && (
          <NavLink to={`/${role.toLowerCase()}`} className="navbar-brand">
            <span>Campus</span>Feed
          </NavLink>
        )}

        <div className="navbar-actions">
          {/* Theme Toggle */}
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <div className={`theme-toggle-track ${theme}`}>
              <div className="theme-toggle-thumb">
                {theme === 'dark' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </div>
            </div>
          </button>

          <NotificationBell />

          {/* Profile User */}
          <div
            onClick={() => setShowProfile(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.05)'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'white',
            }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: 600 }}>{user.name}</span>
          </div>

          <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: '8px' }}>
            {icons.logout}
          </button>
        </div>
      </header>

      {/* Sidebar (Moved out of header stack) */}
      <nav className={`navbar-nav ${isMenuOpen ? 'show' : ''}`}>
        <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <NavLink to={`/${role.toLowerCase()}`} className="navbar-brand" style={{ margin: 0 }}>
            <span>Campus</span>Feed
          </NavLink>
          <button className="btn-close" onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
            {icons.x}
          </button>
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === `/${role.toLowerCase()}`}
            className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Profile Popup */}
      {showProfile && <ProfilePopup onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export default DashboardLayout;
