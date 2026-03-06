import { useState, useEffect } from 'react';
import api from '../../services/api';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function FacultyTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [mySubjectIds, setMySubjectIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ttRes, subRes] = await Promise.all([
        api.get('/timetables'),
        api.get('/subjects'),
      ]);
      // Build set of subject IDs assigned to this faculty
      const ids = new Set(subRes.data.map(s => s.id));
      setMySubjectIds(ids);
      // Filter timetable to only this faculty's subjects
      setTimetable(ttRes.data.filter(e => ids.has(e.subjectId)));
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const groupTimetableByDay = () => {
    const grouped = {};
    DAYS.forEach(d => grouped[d] = []);
    timetable.forEach(entry => {
      grouped[entry.day].push(entry);
    });
    // Sort each day's entries by start time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  };

  const groupedData = groupTimetableByDay();

  return (
    <>
      <header className="top-header">
        <div>
          <h1 className="page-title">My Schedule</h1>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Today: <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
              {currentDay.charAt(0) + currentDay.slice(1).toLowerCase()}
            </strong>
          </span>
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner"></div>
          </div>
        ) : timetable.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            You have no classes scheduled.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
            {DAYS.map(dayName => {
              const entries = groupedData[dayName];
              if (entries.length === 0) return null;
              const isToday = dayName === currentDay;

              return (
                <div key={dayName} className="card" style={{ padding: 0, border: isToday ? '1px solid var(--primary-400)' : undefined }}>
                  <div style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isToday ? 'rgba(139,92,246,0.08)' : 'var(--bg-elevated)',
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span>{dayName.charAt(0) + dayName.slice(1).toLowerCase()}</span>
                    {isToday && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(52,211,153,0.15)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                        Today
                      </span>
                    )}
                  </div>
                  <table className="table">
                    <tbody>
                      {entries.map(entry => (
                        <tr key={entry.id}>
                          <td style={{ width: '150px', fontWeight: 600, color: 'var(--primary-400)' }}>
                            {entry.startTime} — {entry.endTime}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{entry.subject.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.subject.code}</div>
                          </td>
                          <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {entry.batch.branch} Sem {entry.batch.semester} / {entry.batch.section}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default FacultyTimetable;
