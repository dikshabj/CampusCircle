import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import icons from './Icons';
import ProfilePopup from './ProfilePopup';

function DashboardLayout({ role, navItems }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};
  const [showProfile, setShowProfile] = useState(false);

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
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">{icons.graduationCap}</div>
          <span className="sidebar-brand-text">CampusFeed</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">{getRoleLabel()}</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === `/${role.toLowerCase()}`}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            onClick={() => setShowProfile(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-md)',
              padding: 'var(--space-sm) var(--space-md)',
              marginBottom: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'background 150ms ease',
            }}
            className="sidebar-link"
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
              flexShrink: 0,
            }}>
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                {user.name || 'User'}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {role?.toLowerCase()}
              </div>
            </div>
          </div>
          <button className="btn btn-ghost w-full" onClick={handleLogout} style={{ justifyContent: 'flex-start', gap: '10px' }}>
            {icons.logout} <span>Logout</span>
          </button>
        </div>
      </aside>

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
