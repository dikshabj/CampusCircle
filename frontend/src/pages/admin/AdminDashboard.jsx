import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import icons from '../../components/Icons';
import NotificationBell from '../../components/NotificationBell';
import ProfilePopup from '../../components/ProfilePopup';

function AdminDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [stats, setStats] = useState({ batches: 0, students: 0, faculty: 0, posts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [usersRes, batchesRes, postsRes] = await Promise.all([
        api.get('/users'),
        api.get('/batches'),
        api.get('/posts'),
      ]);
      const users = usersRes.data;
      setStats({
        batches: batchesRes.data.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        faculty: users.filter(u => u.role === 'FACULTY').length,
        posts: postsRes.data.length,
      });
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Batches', value: stats.batches, sub: 'Manage in Batches tab', icon: icons.batch, color: 'var(--primary-400)', path: '/admin/batches' },
    { label: 'Total Students', value: stats.students, sub: 'Manage in Users tab', icon: icons.users, color: 'var(--accent-emerald)', path: '/admin/users' },
    { label: 'Total Faculty', value: stats.faculty, sub: 'Manage in Users tab', icon: icons.user, color: 'var(--accent-sky)', path: '/admin/users' },
    { label: 'Active Posts', value: stats.posts, sub: 'Create announcements', icon: icons.megaphone, color: 'var(--accent-amber)', path: '/admin/posts' },
  ];

  const quickActions = [
    { label: 'Create Batch', icon: icons.batch, desc: 'Define branch, semester, section', path: '/admin/batches' },
    { label: 'Import Students', icon: icons.users, desc: 'Bulk upload via CSV', path: '/admin/users' },
    { label: 'Import Faculty', icon: icons.user, desc: 'Bulk upload via CSV', path: '/admin/users' },
    { label: 'Set Timetable', icon: icons.calendar, desc: 'Assign class schedules', path: '/admin/timetable' },
    { label: 'Manage Subjects', icon: icons.grades, desc: 'Add subjects & assign faculty', path: '/admin/subjects' },
    { label: 'View Posts', icon: icons.megaphone, desc: 'Create announcements', path: '/admin/posts' },
  ];

  return (
    <>
      <div className="page-content animate-fade-in">
        {/* Welcome Banner */}
        <div className="card mb-xl" style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(30,30,42,0.4) 100%)',
          borderLeft: '4px solid var(--primary-500)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
                Welcome back, {user.name || 'Admin'}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                Manage your campus from one place. Start by creating batches, then add students and faculty.
              </p>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid mb-xl">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="stat-card"
              style={{ cursor: 'pointer', transition: 'all 200ms ease' }}
              onClick={() => navigate(card.path)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-focus)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="stat-label">{card.label}</span>
                <div style={{ color: card.color, opacity: 0.5 }}>{card.icon}</div>
              </div>
              <span className="stat-value">
                {loading ? '…' : card.value}
              </span>
              <span className="stat-sub">{card.sub}</span>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="analytics-grid mb-xl">
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Campus Distribution</h3>
            <div className="chart-container" style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', height: '160px' }}>
              {[
                { label: 'Students', val: 70, color: 'var(--primary-400)' },
                { label: 'Faculty', val: 20, color: 'rgba(56, 189, 248, 0.4)' },
                { label: 'Admin', val: 10, color: 'rgba(56, 189, 248, 0.2)' }
              ].map((item, i) => (
                <div key={i} style={{ flex: 1, position: 'relative' }}>
                  <div 
                    className="bar-item" 
                    style={{ 
                      height: `${item.val}%`, 
                      background: item.color,
                      borderRadius: '8px 8px 0 0'
                    }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    fontSize: '0.7rem', 
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap'
                  }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>System Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {[
                { label: 'API Requests', val: 85 },
                { label: 'Database Load', val: 40 },
                { label: 'Auth Success', val: 95 }
              ].map((row, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>{row.val}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${row.val}%`, height: '100%', background: 'var(--primary-400)', borderRadius: '10px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 'var(--space-lg)', color: 'var(--text-primary)' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
            {quickActions.map((action, i) => (
              <div
                key={i}
                onClick={() => navigate(action.path)}
                style={{
                  padding: 'var(--space-lg)',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-sm)',
                }}
              >
                <div style={{ color: 'var(--primary-400)' }}>{action.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{action.label}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{action.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showProfile && <ProfilePopup onClose={() => setShowProfile(false)} />}
    </>
  );
}

export default AdminDashboard;
