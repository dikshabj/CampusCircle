import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';
import ProfilePopup from '../../components/ProfilePopup';
import NotificationBell from '../../components/NotificationBell';
import AiAssistant from '../../components/AiAssistant';

function StudentDashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};
  const [showProfile, setShowProfile] = useState(false);
  const [attendancePct, setAttendancePct] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
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
    if (!user.batchId) {
      setTtLoading(false);
      return;
    }
    try {
      const res = await api.get(`/timetables?batchId=${user.batchId}`);
      const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      const now = new Date();
      const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];
      setTimetable(res.data.filter(e => e.day === currentDay).sort((a, b) => a.startTime.localeCompare(b.startTime)));
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setTtLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const attRes = await api.get('/attendance/my-attendance');
      const subRes = await api.get(user.batchId ? `/subjects?batchId=${user.batchId}` : '/subjects');
      setSubjectsCount(subRes.data.length);
      
      const stats = attRes.data;
      if (stats.length > 0) {
        let sumPct = 0;
        stats.forEach(sub => {
          sumPct += sub.total > 0 ? Math.round((sub.present / sub.total) * 100) : 100;
        });
        setAttendancePct(Math.round(sumPct / stats.length));
      } else {
        setAttendancePct(100);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const url = user.batchId ? `/posts?batchId=${user.batchId}` : '/posts';
      const res = await api.get(url);
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
          borderLeft: '4px solid var(--accent-emerald)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
            Welcome back, {user.name || 'Student'}
          </h2>
          {user.batch ? (
            <div style={{ display: 'flex', gap: 'var(--space-xl)', color: 'var(--text-secondary)', fontSize: '0.88rem', flexWrap: 'wrap' }}>
              <span>Branch: <strong style={{ color: 'var(--text-primary)' }}>{user.batch.branch}</strong></span>
              <span>Semester: <strong style={{ color: 'var(--text-primary)' }}>{user.batch.semester}</strong></span>
              <span>Section: <strong style={{ color: 'var(--text-primary)' }}>{user.batch.section}</strong></span>
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Your batch details will appear here once assigned.
            </p>
          )}
        </div>

        <div className="stats-grid mb-xl">
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Attendance</span>
              <div style={{ color: 'var(--accent-emerald)', opacity: 0.5 }}>{icons.check}</div>
            </div>
            <span className="stat-value">{attendancePct}%</span>
            <span className="stat-sub">Overall percentage</span>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Subjects</span>
              <div style={{ color: 'var(--accent-sky)', opacity: 0.5 }}>{icons.batch}</div>
            </div>
            <span className="stat-value">{subjectsCount}</span>
            <span className="stat-sub">This semester</span>
          </div>
          <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="stat-label">Open Disputes</span>
              <div style={{ color: 'var(--accent-amber)', opacity: 0.5 }}>{icons.alert}</div>
            </div>
            <span className="stat-value">0</span>
            <span className="stat-sub">Submitted by you</span>
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

        {/* Analytics Section */}
        <div className="analytics-grid">
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>My Attendance</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xl)' }}>
              <div 
                className="circular-progress" 
                style={{ 
                  '--percent': `${attendancePct}%`,
                  background: `conic-gradient(var(--primary-400) ${attendancePct * 3.6}deg, rgba(255,255,255,0.05) 0)`
                }}
              >
                <span className="progress-value">{attendancePct}%</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>
                  {attendancePct >= 75 ? '🔥 Excellent!' : '⚠️ Needs Focus'}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px', lineHeight: 1.4 }}>
                  {attendancePct >= 75 
                    ? 'You are above the 75% threshold. Keep it up!' 
                    : `You are ${75 - attendancePct}% below the required attendance.`}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)' }}>Performance Trend</h3>
            <div className="chart-container" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px' }}>
              {[60, 85, 45, 90, 75, 95].map((h, i) => (
                <div key={i} style={{ flex: 1, position: 'relative' }}>
                  <div 
                    className="bar-item" 
                    style={{ 
                      height: `${h}%`,
                      background: i === 5 ? 'var(--primary-400)' : 'rgba(14,165,233,0.15)',
                      border: i === 5 ? 'none' : '1px solid rgba(14,165,233,0.3)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 1s ease'
                    }}
                  />
                  <span style={{ 
                    position: 'absolute', 
                    top: '-20px', 
                    left: '50%', 
                    transform: 'translateX(-50%)', 
                    fontSize: '0.65rem', 
                    color: 'var(--text-muted)' 
                  }}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Schedule Section */}
        <div className="glass-card mb-xl">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <span style={{ color: 'var(--primary-400)' }}>{icons.calendar}</span>
              Today's Schedule
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '12px' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
            </span>
          </div>

          {ttLoading ? (
             <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '20px' }}>Loading schedule...</p>
          ) : timetable.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>No classes scheduled for today. Enjoy! ☕</p>
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
                    width: '70px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    color: 'var(--primary-400)',
                    borderRight: '1px solid var(--border-subtle)',
                    paddingRight: '12px'
                  }}>
                    {item.startTime}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.subject?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                       Room {item.room || 'TBD'} • {item.subject?.faculty?.name || 'TBD'}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.6 }}>
                    {item.endTime}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="glass-card mb-xl">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--primary-400)' }}>{icons.edit}</span>
            Pending Assignments
          </h3>
          {postsLoading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading assignments...</p>
          ) : posts.filter(p => p.isAssignment && new Date(p.deadline) > new Date()).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>All caught up! No pending assignments. ✨</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {posts.filter(p => p.isAssignment && new Date(p.deadline) > new Date()).map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  padding: '12px', 
                  background: 'var(--bg-elevated)', 
                  borderRadius: '10px',
                  borderLeft: '4px solid var(--primary-400)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {new Date(item.deadline).toLocaleDateString()}</div>
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 800, 
                    color: Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24)) <= 2 ? '#ff4d4d' : 'var(--accent-emerald)',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px 8px',
                    borderRadius: '8px'
                  }}>
                    {Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', textAlign: 'center', padding: '24px 0' }}>No announcements yet.</p>
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
      <AiAssistant />
    </>
  );
}

export default StudentDashboard;
