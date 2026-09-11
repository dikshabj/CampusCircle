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
  const [timetable, setTimetable] = useState([]);
  const [ttLoading, setTtLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchPosts();
    fetchTodaySchedule();
  }, []);

  const fetchTodaySchedule = async () => {
    try {
      const [ttRes, subRes] = await Promise.all([
        api.get('/timetables'),
        api.get('/subjects'),
      ]);
      const mySubjectIds = new Set(subRes.data.map(s => s.id));
      const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      const now = new Date();
      const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
      
      const todayClasses = ttRes.data.filter(e => e.day === currentDay && mySubjectIds.has(e.subjectId));
      setTimetable(todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    } catch (err) {
      console.error('Failed to fetch faculty timetable', err);
    } finally {
      setTtLoading(false);
    }
  };

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
      <div className="page-content animate-fade-in">
        <div className="card mb-xl" style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(30,30,42,0.4) 100%)',
          borderLeft: '4px solid var(--accent-sky)',
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

        {/* Today's Schedule Section */}
        <div className="card mb-xl">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span style={{ color: 'var(--primary-400)' }}>{icons.calendar}</span>
              Today's Teaching Schedule
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '12px' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
            </span>
          </div>

          {ttLoading ? (
             <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '20px' }}>Loading schedule...</p>
          ) : timetable.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>No classes scheduled for today. Enjoy your break! ☕</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {timetable.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '15px', 
                  padding: '12px 16px', 
                  background: 'var(--bg-elevated)', 
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ 
                    width: '140px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    color: 'var(--primary-400)',
                    borderRight: '1px solid var(--border-subtle)',
                    paddingRight: '12px'
                  }}>
                    {item.startTime} — {item.endTime}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.subject?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                       {item.batch?.branch} (Sem {item.batch?.semester}, Sec {item.batch?.section})
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Room {item.room || 'TBD'}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Classroom</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
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
