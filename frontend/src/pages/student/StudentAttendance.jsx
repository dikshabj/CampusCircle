import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

function StudentAttendance() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('date');
  // Robust YYYY-MM-DD generator
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());

  const [detailedLogs, setDetailedLogs] = useState([]);
  const [raisingDispute, setRaisingDispute] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    fetchStats();
    fetchDetailedLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/attendance/my-attendance');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance stats', err);
    }
  };

  const fetchDetailedLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/my-logs');
      setDetailedLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance logs', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/disputes', { recordId: raisingDispute, reason: disputeReason });
      alert('Dispute raised successfully');
      setRaisingDispute(null);
      setDisputeReason('');
      fetchDetailedLogs();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to raise dispute');
    }
  };

  const today = getTodayString();

  // EXTREMELY ROBUST date comparison helper
  const toLocalDate = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    
    // We want the local calendar date from the given UTC date
    // Note: Database saves 2026-03-05T00:00:00Z. For an Indian user, Mar 05 05:30:00 is Mar 05.
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (dateStr) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

  // Filter logs for selected date (Only show sessions where teacher has SUBMITTED attendance)
  const logsForDate = detailedLogs.filter(log => {
    const isTodayMatch = toLocalDate(log.session.date) === selectedDate;
    const isMarked = log.status === 'PRESENT' || log.status === 'ABSENT';
    return isTodayMatch && isMarked;
  });

  // Overall — show ALL subjects in the batch
  const activeStats = stats;

  // Build sparkline data per subject from detailedLogs
  const buildSparklineData = (subjectCode) => {
    const subLogs = detailedLogs
      .filter(log => log.session.subject.code === subjectCode && log.status !== 'UNMARKED')
      .sort((a, b) => new Date(a.session.date) - new Date(b.session.date));

    let present = 0;
    return subLogs.map((log, idx) => {
      if (log.status === 'PRESENT') present++;
      return { idx: idx + 1, pct: Math.round((present / (idx + 1)) * 100) };
    });
  };

  // Mini SVG sparkline with trend calculation
  const Sparkline = ({ data, color }) => {
    if (data.length < 2) return <div style={{ height: '40px', display: 'flex', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Need 2+ classes for trend</div>;
    const W = 160, H = 50;
    const maxX = data.length - 1;
    const points = data.map((d, i) => {
      const x = (i / maxX) * W;
      const y = H - (d.pct / 100) * H;
      return `${x},${y}`;
    }).join(' ');

    const last = data[data.length - 1].pct;
    const prev = data[data.length - 2].pct;
    const trend = last - prev;

    return (
      <div style={{ position: 'relative' }}>
        <svg width={W} height={H} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points}
          />
          <polygon
            fill={`url(#grad-${color})`}
            points={`0,${H} ${points} ${W},${H}`}
          />
          <circle cx={W} cy={H - (last / 100) * H} r="4" fill={color} stroke="var(--bg-card)" strokeWidth="2" />
        </svg>
        <div style={{ 
          position: 'absolute', top: -15, right: 0, 
          fontSize: '0.65rem', fontWeight: 800,
          color: trend > 0 ? 'var(--accent-emerald)' : trend < 0 ? 'var(--primary-400)' : 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: '2px'
        }}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : ''} {Math.abs(trend)}% trend
        </div>
      </div>
    );
  };

  const getPctColor = (pct) =>
    pct >= 75 ? 'var(--accent-emerald)' : pct >= 60 ? 'var(--accent-amber)' : 'var(--primary-400)';

  return (
    <>
      <header className="top-header">
        <div>
          <h1 className="page-title">My Attendance</h1>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            📅 {formatDisplayDate(selectedDate)}
            {selectedDate === today && (
              <span style={{ marginLeft: '8px', fontSize: '0.65rem', fontWeight: 800, background: 'rgba(52,211,153,0.15)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                Today
              </span>
            )}
          </span>
        </div>
      </header>

      <div className="page-content animate-fade-in">

        {/* Tabs + Date Picker */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            {[{ key: 'date', label: '📅 By Date' }, { key: 'overall', label: '📊 Overall' }].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '7px 20px', borderRadius: 'calc(var(--radius-md) - 2px)', border: 'none', cursor: 'pointer',
                  fontSize: '0.85rem', fontWeight: 600, transition: 'all 200ms',
                  background: activeTab === tab.key ? 'var(--primary-500)' : 'transparent',
                  color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'date' && (
            <input
              type="date" className="form-input"
              style={{ width: '160px', marginBottom: 0 }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={today}
            />
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner"></div>
          </div>
        ) : activeTab === 'date' ? (
          /* ── BY DATE TAB ── */
          logsForDate.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
              <h3 style={{ marginBottom: '8px' }}>No session found</h3>
              <p style={{ fontSize: '0.88rem', marginBottom: '24px' }}>Teacher hasn't submitted attendance for {formatDisplayDate(selectedDate)}.</p>
              
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', maxWidth: '400px', margin: '0 auto 24px auto', fontSize: '0.8rem', textAlign: 'left', border: '1px dashed rgba(255,255,255,0.06)' }}>
                <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--text-primary)' }}>Why am I seeing this?</strong>
                • Make sure you are in the correct Batch.<br/>
                • Session might be listed under a different date due to server lag.<br/>
                • Teacher might have only marked a subset of students.
              </div>

              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => { fetchStats(); fetchDetailedLogs(); }}
                style={{ gap: '8px' }}
              >
                ↺ Refresh Data
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {logsForDate.map(log => (
                <div key={log.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{log.session.subject.name}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {log.session.subject.code}
                    </p>
                    {log.disputes?.length > 0 && (
                      <span style={{ fontSize: '0.68rem', background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                        Dispute: {log.disputes[0].status}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      padding: '6px 16px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800,
                      background: log.status === 'PRESENT' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: log.status === 'PRESENT' ? 'var(--accent-emerald)' : 'var(--primary-400)',
                    }}>
                      {log.status}
                    </span>
                    {log.status === 'ABSENT' && log.disputes?.length === 0 && (
                      selectedDate === today ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => setRaisingDispute(log.id)}>
                          Raise Dispute
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}
                          title="Disputes can only be raised for today's attendance">
                          🔒 Locked
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )

        ) : (
          /* ── OVERALL TAB — Aggregate Summary + Sparkline Graph Cards ── */
          activeStats.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              No attendance has been recorded for any subject yet.
            </div>
          ) : (
            <>
            {/* Aggregate Summary Header */}
            <div className="glass-card mb-xl" style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              background: 'linear-gradient(135deg, rgba(88,80,236,0.05) 0%, rgba(30,30,42,0.9) 100%)',
              borderLeft: '4px solid var(--primary-500)', padding: 'var(--space-lg) var(--space-xl)'
            }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '4px' }}>Semester Attendance Growth</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Average across {activeStats.length} active subjects</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-400)' }}>
                  {Math.round(activeStats.reduce((acc, s) => acc + (s.total > 0 ? (s.present / s.total) : 1), 0) / (activeStats.length || 1) * 100)}%
                </span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Overall Score</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
              {activeStats.map(sub => {
                const pct = sub.total > 0 ? Math.round((sub.present / sub.total) * 100) : 0;
                const color = getPctColor(pct);
                const sparkData = buildSparklineData(sub.code);

                return (
                  <div key={sub.code} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Subject header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                      <div>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '2px' }}>{sub.name}</h3>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{sub.code}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color, lineHeight: 1 }}>{pct}%</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {sub.present}/{sub.total} classes
                        </div>
                      </div>
                    </div>

                    {/* Sparkline trend chart */}
                    <div style={{ marginBottom: 'var(--space-md)', display: 'flex', justifyContent: 'flex-end' }}>
                      <Sparkline data={sparkData} color={color} />
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: 'var(--space-sm)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.8s ease' }} />
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.75rem' }}>
                      <div style={{ background: 'rgba(16,185,129,0.06)', padding: '5px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ opacity: 0.6, fontSize: '0.6rem', textTransform: 'uppercase' }}>Present</div>
                        <strong style={{ color: 'var(--accent-emerald)' }}>{sub.present}</strong>
                      </div>
                      <div style={{ background: 'rgba(239,68,68,0.06)', padding: '5px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ opacity: 0.6, fontSize: '0.6rem', textTransform: 'uppercase' }}>Absent</div>
                        <strong style={{ color: 'var(--primary-400)' }}>{sub.total - sub.present}</strong>
                      </div>
                      <div style={{ background: 'var(--bg-elevated)', padding: '5px', borderRadius: '4px', textAlign: 'center' }}>
                        <div style={{ opacity: 0.6, fontSize: '0.6rem', textTransform: 'uppercase' }}>Total</div>
                        <strong>{sub.total}</strong>
                      </div>
                    </div>

                    {/* Warning */}
                    {pct < 75 && (
                      <div style={{ marginTop: 'var(--space-md)', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', color: 'var(--primary-400)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {icons.alert} Shortage! Need {Math.ceil((0.75 * sub.total - sub.present) / 0.25)} more classes.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </>
          )
        )}
      </div>

      {/* Raise Dispute Modal */}
      {raisingDispute && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Raise Attendance Dispute</h3>
              <button className="modal-close" onClick={() => setRaisingDispute(null)}>{icons.close}</button>
            </div>
            <form onSubmit={handleRaiseDispute} style={{ padding: 'var(--space-lg)' }}>
              <div className="form-group">
                <label className="form-label">Reason for Dispute</label>
                <textarea
                  className="form-input"
                  placeholder="E.g. I was present but marked absent by mistake..."
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  required
                  style={{ minHeight: '100px' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setRaisingDispute(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Dispute</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentAttendance;
