import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

function FacultyDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const res = await api.get('/disputes/faculty');
      setDisputes(res.data);
    } catch (err) {
      setError('Failed to fetch attendance disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId, status) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this dispute?`)) return;
    try {
      await api.patch(`/disputes/${disputeId}/resolve`, { status });
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status } : d));
    } catch (err) {
      alert(err.response?.data?.message || 'Resolution failed');
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;

  return (
    <div className="page-content animate-fade-in">
      <header className="top-header">
        <h1 className="page-title">Attendance Disputes</h1>
      </header>

      {disputes.length === 0 ? (
        <div className="empty-state card animate-fade-in">
          <div style={{ color: 'var(--text-muted)', fontSize: '3rem', marginBottom: 'var(--space-md)' }}>{icons.check}</div>
          <h3 style={{ marginBottom: '8px' }}>No Pending Disputes</h3>
          <p style={{ color: 'var(--text-muted)' }}>All student attendance claims have been reviewed.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Subject</th>
                <th>Reason</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600 }}>{new Date(d.record.session.date).toLocaleDateString()}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.student.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.student.rollNumber}</div>
                  </td>
                  <td>{d.record.session.subject.name}</td>
                  <td style={{ maxWidth: '200px', fontSize: '0.85rem' }}>
                    <div title={d.reason} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.reason}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${d.status.toLowerCase()}`} style={{
                      background: d.status === 'PENDING' ? 'rgba(245,158,11,0.1)' : d.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: d.status === 'PENDING' ? 'var(--accent-amber)' : d.status === 'APPROVED' ? 'var(--accent-emerald)' : 'var(--primary-400)',
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700
                    }}>
                      {d.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {d.status === 'PENDING' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn btn-emerald btn-sm" onClick={() => handleResolve(d.id, 'APPROVED')} title="Approve">
                          {icons.check}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary-400)' }} onClick={() => handleResolve(d.id, 'REJECTED')} title="Reject">
                          {icons.close}
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Finalized</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FacultyDisputes;
