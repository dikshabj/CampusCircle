import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

function StudentDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes/student');
      setDisputes(res.data);
    } catch (err) {
      console.error('Failed to fetch attendance disputes', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  return (
    <>
      <header className="top-header">
        <h1 className="page-title">My Disputes</h1>
      </header>

      <div className="page-content animate-fade-in">
        {disputes.length === 0 ? (
          <div className="empty-state card animate-fade-in">
            <div style={{ color: 'var(--text-muted)', fontSize: '3rem', marginBottom: 'var(--space-md)' }}>{icons.alert}</div>
            <h3 style={{ marginBottom: '8px' }}>No Disputes Raised</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', lineHeight: 1.6 }}>
              You haven't raised any attendance disputes yet. To raise one, go to{' '}
              <strong style={{ color: 'var(--accent-sky)' }}>My Attendance</strong> → click{' '}
              <strong style={{ color: 'var(--accent-sky)' }}>View Logs</strong> on a subject → tap{' '}
              <strong style={{ color: 'var(--accent-sky)' }}>Raise Dispute</strong> on an absent entry.
            </p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Submitted On</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{new Date(d.record.session.date).toLocaleDateString()}</td>
                    <td>{d.record.session.subject.name}</td>
                    <td style={{ maxWidth: '250px', fontSize: '0.85rem' }}>
                      <div title={d.reason} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.reason}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: d.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : d.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: d.status === 'PENDING' ? 'var(--accent-amber)' : d.status === 'APPROVED' ? 'var(--accent-emerald)' : 'var(--primary-400)',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700
                      }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default StudentDisputes;

