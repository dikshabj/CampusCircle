import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

function FacultyMentorship() {
  const [students, setStudents] = useState([]);
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null); // Detailed report

  useEffect(() => {
    fetchBatchData();
  }, []);

  const fetchBatchData = async () => {
    try {
      const bRes = await api.get('/mentorship/batch');
      setBatch(bRes.data);
      const sRes = await api.get('/mentorship/students');
      setStudents(sRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch batch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentReport = async (studentId) => {
    try {
      const res = await api.get(`/mentorship/student/${studentId}`);
      setSelectedStudent(res.data);
    } catch (err) {
      alert('Failed to fetch student report');
    }
  };

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>;
  if (error) return <div className="error-card">{error}</div>;

  return (
    <div className="page-content animate-fade-in">
      <header className="top-header">
        <h1 className="page-title">
          Mentorship Batch: <span style={{ color: 'var(--accent-sky)' }}>{batch?.branch} {batch?.semester}/{batch?.section}</span>
        </h1>
      </header>

      <div className="stats-grid mb-xl">
        <div className="stat-card">
          <span className="stat-label">Total Students</span>
          <span className="stat-value">{students.length}</span>
          <span className="stat-sub">Assigned to you</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Attendance</span>
          <span className="stat-value">
            {students.length > 0 ? Math.round(students.reduce((acc, s) => acc + s.attendancePct, 0) / students.length) : 0}%
          </span>
          <span className="stat-sub">Batch performance</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Attendance</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 700 }}>{s.rollNumber}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.email}</div>
                </td>
                <td>
                  <div style={{ width: '120px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
                      <span>Progress</span>
                      <span>{s.attendancePct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${s.attendancePct}%`, 
                        height: '100%', 
                        background: s.attendancePct < 75 ? 'var(--primary-400)' : 'var(--accent-emerald)',
                        borderRadius: '10px'
                      }}></div>
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => fetchStudentReport(s.id)}>
                    View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Report Modal */}
      {selectedStudent && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Performance: {selectedStudent.student.name}</h3>
              <button className="modal-close" onClick={() => setSelectedStudent(null)}>{icons.close}</button>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: 'var(--space-md)' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
                {/* Attendance Summary */}
                <div className="card">
                  <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Overall Attendance</h4>
                  {selectedStudent.attendance.map(a => (
                    <div key={a.subjectCode} style={{ marginBottom: 'var(--space-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.82rem' }}>{a.subjectName}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{a.pct}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                        <div style={{ width: `${a.pct}%`, height: '100%', background: 'var(--accent-sky)' }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Marks Summary */}
                <div className="card">
                  <h4 style={{ marginBottom: 'var(--space-md)', fontSize: '1rem' }}>Academic Performance</h4>
                  <table className="table" style={{ fontSize: '0.8rem' }}>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Exam</th>
                        <th>Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStudent.marks.map((m, idx) => (
                        <tr key={idx}>
                          <td>{m.subject}</td>
                          <td>{m.exam}</td>
                          <td style={{ fontWeight: 700 }}>{m.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {selectedStudent.marks.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No marks uploaded yet</p>
                  )}
                </div>
              </div>

            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setSelectedStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyMentorship;
