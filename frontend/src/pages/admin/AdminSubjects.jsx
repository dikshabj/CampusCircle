import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [batchId, setBatchId] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subs, bats, facs] = await Promise.all([
        api.get('/subjects'),
        api.get('/batches'),
        api.get('/users?role=FACULTY')
      ]);
      setSubjects(subs.data);
      setBatches(bats.data);
      setFaculty(facs.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const data = { name, code, batchId, facultyId: facultyId || null };

    try {
      if (editingId) {
        await api.patch(`/subjects/${editingId}`, data);
      } else {
        await api.post('/subjects', data);
      }
      fetchData();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (sub) => {
    setEditingId(sub.id);
    setName(sub.name);
    setCode(sub.code);
    setBatchId(sub.batchId);
    setFacultyId(sub.facultyId || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      await api.delete(`/subjects/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete subject');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setName('');
    setCode('');
    setBatchId('');
    setFacultyId('');
    setError('');
  };

  return (
    <>
      <header className="top-header">
        <h1 className="page-title">Manage Subjects</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ gap: '8px' }}>
            {icons.grades} Add Subject
          </button>
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Batch</th>
                  <th>Faculty</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id}>
                    <td><div style={{ fontWeight: 600 }}>{s.name}</div></td>
                    <td><code>{s.code}</code></td>
                    <td>{s.batch.branch} {s.batch.semester}/{s.batch.section}</td>
                    <td>
                      {s.faculty ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-sky)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white' }}>
                            {s.faculty.name[0]}
                          </div>
                          {s.faculty.name}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Not Assigned</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn-icon btn-ghost" onClick={() => handleEdit(s)} title="Edit">
                          {icons.edit}
                        </button>
                        <button className="btn-icon btn-ghost" style={{ color: 'var(--primary-400)' }} onClick={() => handleDelete(s.id)} title="Delete">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button className="modal-close" onClick={closeModal}>{icons.close}</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input 
                  className="form-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject Code</label>
                <input 
                  className="form-input" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Batch</label>
                <select 
                  className="form-input" 
                  value={batchId} 
                  onChange={(e) => setBatchId(e.target.value)} 
                  required
                >
                  <option value="">Select Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.branch} {b.semester}/{b.section}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Faculty (Optional)</label>
                <select 
                  className="form-input" 
                  value={facultyId} 
                  onChange={(e) => setFacultyId(e.target.value)}
                >
                  <option value="">Select Faculty</option>
                  {faculty.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.facultyId})</option>
                  ))}
                </select>
              </div>

              {error && (
                <div style={{ color: 'var(--primary-400)', fontSize: '0.8rem', marginTop: '10px' }}>
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Subject'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminSubjects;
