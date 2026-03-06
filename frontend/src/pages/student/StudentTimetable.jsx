import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function StudentTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showToday, setShowToday] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const now = new Date();
  const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Offset for Sunday
  const currentTime = now.getHours() * 60 + now.getMinutes();

  useEffect(() => {
    if (user.batchId) fetchTimetable();
    else setLoading(false);
  }, []);

  const fetchTimetable = async () => {
    try {
      const res = await api.get(`/timetables?batchId=${user.batchId}`);
      setTimetable(res.data);
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingClass = () => {
    const todayClasses = timetable.filter(e => e.day === currentDay);
    return todayClasses
      .map(e => {
        const [h, m] = e.startTime.split(':').map(Number);
        return { ...e, minutes: h * 60 + m };
      })
      .filter(e => e.minutes > currentTime)
      .sort((a, b) => a.minutes - b.minutes)[0];
  };

  const groupTimetableByDay = () => {
    const grouped = {};
    DAYS.forEach(d => grouped[d] = []);
    timetable.forEach(entry => {
      grouped[entry.day].push(entry);
    });
    return grouped;
  };

  const upcoming = getUpcomingClass();
  const groupedData = groupTimetableByDay();

  return (
    <>
      <header className="top-header">
        <h1 className="page-title">My Schedule</h1>
        <div className="header-actions">
           <button 
            className={`btn btn-${showToday ? 'primary' : 'secondary'} btn-sm`}
            onClick={() => setShowToday(!showToday)}
           >
             {showToday ? 'Show Week' : 'Focus Today'}
           </button>
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {!user.batchId ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>⌛</div>
            <h3 style={{ marginBottom: '8px' }}>Batch Assignment Pending</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              You haven't been assigned to a batch yet. Please contact admin or wait for assignment.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
               Sync My Profile
            </button>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="spinner"></div></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            
            {/* Upcoming Highlight */}
            {upcoming && (
              <div className="glass-card" style={{ 
                background: 'var(--gradient-primary)', 
                border: 'none',
                padding: 'var(--space-lg) var(--space-xl)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, color: 'white', textTransform: 'uppercase', marginBottom: '8px' }}>Upcoming Next</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem' }}>{upcoming.subject.name}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Room {upcoming.room || 'TBD'} • {upcoming.startTime}</p>
                  </div>
                  <div style={{ fontSize: '2rem', opacity: 0.5 }}>{icons.clock}</div>
                </div>
              </div>
            )}

            {DAYS.map(dayName => {
              const entries = groupedData[dayName];
              if (entries.length === 0) return null;
              if (showToday && dayName !== currentDay) return null;
              
              return (
                <div key={dayName} className="glass-card" style={{ padding: 0 }}>
                  <div style={{ 
                    padding: 'var(--space-md) var(--space-lg)', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    background: dayName === currentDay ? 'rgba(59,130,246,0.1)' : 'transparent', 
                    fontWeight: 700, 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ textTransform: 'capitalize' }}>{dayName.toLowerCase()}</span>
                    {dayName === currentDay && <span className="status-badge active" style={{ fontSize: '0.65rem' }}>Today</span>}
                  </div>
                  <div style={{ padding: 'var(--space-md)' }}>
                    {entries.map((entry, idx) => {
                      const [h, m] = entry.startTime.split(':').map(Number);
                      const entryMins = h * 60 + m;
                      const isPast = dayName === currentDay && entryMins < currentTime - 60; // Approx 1hr buffer

                      return (
                        <div key={entry.id} style={{ 
                          display: 'flex', 
                          padding: '12px 16px', 
                          borderRadius: 'var(--radius-md)',
                          background: upcoming?.id === entry.id ? 'rgba(255,255,255,0.03)' : 'transparent',
                          opacity: isPast ? 0.4 : 1,
                          marginBottom: idx === entries.length - 1 ? 0 : '8px',
                          border: upcoming?.id === entry.id ? '1px solid var(--primary-400)' : '1px solid transparent'
                        }}>
                          <div style={{ width: '120px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {entry.startTime}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{entry.subject.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{entry.subject.code} • {entry.subject.faculty?.name || 'Faculty TBD'}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
            
            {timetable.length === 0 && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                No classes scheduled for your batch.
              </div>
            )}

            {showToday && timetable.filter(e => e.day === currentDay).length === 0 && (
               <div className="glass-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                No classes scheduled for today. Enjoy your day!
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default StudentTimetable;
