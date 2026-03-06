import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

function StudentMarks() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get('/marks/my-results');
      setResults(res.data);
    } catch (err) {
      console.error('Failed to fetch results', err);
    } finally {
      setLoading(false);
    }
  };

  const groupResultsBySubject = () => {
    const grouped = {};
    results.forEach(r => {
      const subId = r.subjectId;
      if (!grouped[subId]) {
        grouped[subId] = { 
          name: r.subject.name, 
          code: r.subject.code, 
          MST1: '-', 
          MST2: '-', 
          FINAL: '-' 
        };
      }
      grouped[subId][r.examType] = r.marks;
    });
    return Object.values(grouped);
  };

  const data = groupResultsBySubject();

  return (
    <>
      <header className="top-header">
        <h1 className="page-title">My Grades</h1>
      </header>

      <div className="page-content animate-fade-in">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
             <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th style={{ textAlign: 'center' }}>MST 1</th>
                    <th style={{ textAlign: 'center' }}>MST 2</th>
                    <th style={{ textAlign: 'center' }}>Final</th>
                    <th style={{ textAlign: 'center' }}>Total (Avg)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No results published yet.
                      </td>
                    </tr>
                  ) : (
                    data.map(sub => {
                      const m1 = sub.MST1 === '-' ? 0 : sub.MST1;
                      const m2 = sub.MST2 === '-' ? 0 : sub.MST2;
                      const f = sub.FINAL === '-' ? 0 : sub.FINAL;
                      const count = (sub.MST1 !== '-' ? 1 : 0) + (sub.MST2 !== '-' ? 1 : 0) + (sub.FINAL !== '-' ? 1 : 0);
                      const avg = count > 0 ? Math.round((m1 + m2 + f) / count) : 0;

                      return (
                        <tr key={sub.code}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{sub.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.code}</div>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{sub.MST1}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{sub.MST2}</td>
                          <td style={{ textAlign: 'center', fontWeight: 600 }}>{sub.FINAL}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span style={{ 
                              padding: '4px 10px', 
                              borderRadius: '20px', 
                              background: avg >= 40 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', 
                              color: avg >= 40 ? 'var(--success)' : 'var(--error)',
                              fontWeight: 800,
                              fontSize: '0.8rem'
                            }}>
                              {avg}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </>
  );
}

export default StudentMarks;
