import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';
import ProfilePopup from '../../components/ProfilePopup';
import NotificationBell from '../../components/NotificationBell';

function FacultyDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};
  const [showProfile, setShowProfile] = useState(false);
  const [subjectsCount, setSubjectsCount] = useState(0);
  const [pendingDisputes, setPendingDisputes] = useState(0);
  const [isMentor, setIsMentor] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchPosts();
  }, []);

  const fetchStats = async () => {
    try {
      const subRes = await api.get('/subjects');
      setSubjectsCount(subRes.data.length);

      const dispRes = await api.get('/disputes/faculty');
      setPendingDisputes(dispRes.data.filter(d => d.status === 'PENDING').length);

      try {
        await api.get('/mentorship/batch');
        setIsMentor(true);
      } catch {
        setIsMentor(false);
      }
    } catch (err) {
      console.error('Failed to fetch faculty stats', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setPostsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <header className="top-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="header-actions">
          <NotificationBell />
          <div className="header-avatar" onClick={() => setShowProfile(true)} title="Profile">
            {user.name?.[0]?.toUpperCase() || 'F'}
          </div>
        </div>
      </header>

      <div className="page-content animate-fade-in">
        <div className="glass-card mb-xl" style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(30,30,42,0.9) 100%)',
          borderLeft: '3px solid var(--accent-sky)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
            Welcome back, {user.name || 'Faculty'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Mark attendance, review disputes, upload marks, and create posts for your students.
          </p>
        </div>

        <div className="stats-grid mb-xl">
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">My Subjects</span>
              <div style={{ color: 'var(--accent-sky)', opacity: 0.5 }}>{icons.batch}</div>
            </div>
            <span className="stat-value">{subjectsCount}</span>
            <span className="stat-sub">Assigned by admin</span>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Mentorship</span>
              <div style={{ color: 'var(--accent-emerald)', opacity: 0.5 }}>{icons.users}</div>
            </div>
            <span className="stat-value" style={{ color: isMentor ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
              {isMentor ? 'Active' : 'N/A'}
            </span>
            <span className="stat-sub">{isMentor ? 'Batch Mentor' : 'Not assigned'}</span>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Pending Disputes</span>
              <div style={{ color: 'var(--accent-amber)', opacity: 0.5 }}>{icons.alert}</div>
            </div>
            <span className="stat-value" style={{ color: pendingDisputes > 0 ? 'var(--primary-400)' : 'inherit' }}>
              {pendingDisputes}
            </span>
            <span className="stat-sub">Review required</span>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Announcements</span>
              <div style={{ color: 'var(--primary-400)', opacity: 0.5 }}>{icons.megaphone}</div>
            </div>
            <span className="stat-value">{posts.length}</span>
            <span className="stat-sub">Total posts</span>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary-400)' }}>{icons.megaphone}</span>
            Recent Announcements
          </h3>
          {postsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '24px 0' }}>Loading posts...</p>
          ) : posts.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '24px 0' }}>No announcements yet. Create one from the Announcements page.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {posts.slice(0, 5).map(post => (
                <div key={post.id} style={{
                  padding: 'var(--space-md)',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>{post.title}</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.5 }}>{post.content}</p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.72rem',
                        background: post.batchId ? 'rgba(52,211,153,0.12)' : 'rgba(139,92,246,0.12)',
                        color: post.batchId ? 'var(--accent-emerald)' : 'var(--primary-400)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'block',
                        marginBottom: '4px',
                      }}>
                        {post.batchId ? 'Batch' : 'Global'}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                    By {post.author?.name || 'Unknown'} · {post.author?.role}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showProfile && <ProfilePopup onClose={() => setShowProfile(false)} />}
    </>
  );
}

export default FacultyDashboard;
