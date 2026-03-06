import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

function FacultyAttendance() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getTodayString());

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: 'PRESENT' | 'ABSENT' }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchMySubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId && date) {
      fetchAttendanceData();
    } else {
      setStudents([]);
      setAttendance({});
    }
  }, [selectedSubjectId, date]);

  const fetchMySubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubjectId(res.data[0].id);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    setMessage('');
    try {
      // 1. Try to get existing session
      const sessionRes = await api.get(`/attendance/session?subjectId=${selectedSubjectId}&date=${date}`);
      
      if (sessionRes.data.records && sessionRes.data.records.length > 0) {
        // Session exists, use it
        const records = sessionRes.data.records;
        const initialAttendance = {};
        const studentList = records.map(r => {
          initialAttendance[r.studentId] = r.status;
          return { id: r.studentId, ...r.student };
        });
        setStudents(studentList);
        setAttendance(initialAttendance);
      } else {
        // No session, get all students for subject — start with NO status (faculty must mark manually)
        const studentsRes = await api.get(`/attendance/students/${selectedSubjectId}`);
        setStudents(studentsRes.data);
        setAttendance({}); // all blank by default
      }
    } catch (err) {
      console.error('Failed to fetch attendance info', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const records = Object.entries(attendance).map(([studentId, status]) => ({
      studentId, status
    }));

    try {
      await api.post('/attendance/mark', {
        subjectId: selectedSubjectId,
        date,
        records
      });
      setMessage('Attendance saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="top-header">
        <div>
          <h1 className="page-title">Mark Attendance</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              📅 {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {date === new Date().toISOString().split('T')[0] && (
              <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(52,211,153,0.15)', color: 'var(--accent-emerald)', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Today
              </span>
            )}
          </div>
        </div>
        <div className="header-actions" style={{ gap: '12px' }}>
          <select 
            className="form-input" 
            style={{ width: '200px', marginBottom: 0 }}
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.batch.branch}-{s.batch.section})</option>
            ))}
          </select>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: '160px', marginBottom: 0 }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {!selectedSubjectId ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p>You have no assigned subjects.</p>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Students ({students.length})
                  {Object.keys(attendance).length < students.length && (
                    <span style={{ marginLeft: '10px', fontSize: '0.7rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                      ⚠ {students.length - Object.values(attendance).filter(v => v).length} unmarked
                    </span>
                  )}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <button
                     className="btn btn-sm"
                     style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700 }}
                     onClick={() => {
                       const next = {};
                       students.forEach(s => next[s.id] = 'PRESENT');
                       setAttendance(next);
                     }}
                   >
                     ✓ All Present
                   </button>
                   <button
                     className="btn btn-sm"
                     style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--primary-400)', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 700 }}
                     onClick={() => {
                       const next = {};
                       students.forEach(s => next[s.id] = 'ABSENT');
                       setAttendance(next);
                     }}
                   >
                     ✗ All Absent
                   </button>
                   <button
                     className="btn btn-ghost btn-sm"
                     onClick={() => setAttendance({})}
                     title="Clear all selections"
                   >
                     ↺ Clear
                   </button>
                </div>
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 600 }}>{student.rollNumber}</td>
                      <td>{student.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: '3px', border: '1px solid var(--border-subtle)' }}>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'PRESENT')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: attendance[student.id] === 'PRESENT' ? 'var(--success)' : 'transparent',
                              color: attendance[student.id] === 'PRESENT' ? 'white' : 'var(--text-muted)',
                            }}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'ABSENT')}
                            style={{
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              background: attendance[student.id] === 'ABSENT' ? 'var(--error)' : 'transparent',
                              color: attendance[student.id] === 'ABSENT' ? 'white' : 'var(--text-muted)',
                            }}
                          >
                            A
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: 'var(--space-lg)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ fontSize: '0.85rem', color: message.includes('success') ? 'var(--success)' : 'var(--error)' }}>
                   {message}
                 </div>
                 <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                   {saving ? 'Saving...' : 'Save Attendance'}
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default FacultyAttendance;
