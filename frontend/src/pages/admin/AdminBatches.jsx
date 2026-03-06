import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';

function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState(1);
  const [section, setSection] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      setBatches(res.data);
    } catch (err) {
      console.error('Failed to fetch batches', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const data = { branch, semester: parseInt(semester), section };

    try {
      if (editingId) {
        await api.patch(`/batches/${editingId}`, data);
      } else {
        await api.post('/batches', data);
      }
      fetchBatches();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save batch');
    }
  };

  const handleEdit = (batch) => {
    setEditingId(batch.id);
    setBranch(batch.branch);
    setSemester(batch.semester);
    setSection(batch.section);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;
    try {
      await api.delete(`/batches/${id}`);
      fetchBatches();
    } catch (err) {
      alert('Failed to delete batch');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setBranch('');
    setSemester(1);
    setSection('');
    setError('');
  };

  return (
    <>
      <header className="top-header">
        <h1 className="page-title">Manage Batches</h1>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ gap: '8px' }}>
            {icons.batch} Add Batch
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
                  <th>Branch</th>
                  <th>Semester</th>
                  <th>Section</th>
                  <th>Students</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No batches found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  batches.map((batch) => (
                    <tr key={batch.id}>
                      <td><span style={{ fontWeight: 600 }}>{batch.branch}</span></td>
                      <td>Sem {batch.semester}</td>
                      <td>{batch.section}</td>
                      <td>{batch._count?.users || 0}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn-icon btn-ghost" onClick={() => handleEdit(batch)} title="Edit">
                            {icons.edit}
                          </button>
                          <button className="btn-icon btn-ghost" style={{ color: 'var(--primary-400)' }} onClick={() => handleDelete(batch.id)} title="Delete">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Batch' : 'Add New Batch'}</h3>
              <button className="modal-close" onClick={closeModal}>{icons.close}</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. CSE, ECE, ME" 
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Semester</label>
                <select 
                  className="form-input" 
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                >
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section</label>
                <input 
                  className="form-input" 
                  placeholder="e.g. A, B, C" 
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required 
                />
              </div>

              {error && (
                <div style={{ color: 'var(--primary-400)', fontSize: '0.8rem', marginTop: '10px' }}>
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Batch'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminBatches;
