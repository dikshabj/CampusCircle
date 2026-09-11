import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';
import Toast from '../../components/Toast';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function AdminTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');
  const [importMode, setImportMode] = useState('file'); // 'file' or 'link'
  const [sheetLink, setSheetLink] = useState('');
  const [generating, setGenerating] = useState(false);

  // Form state
  const [day, setDay] = useState('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [subjectId, setSubjectId] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      fetchTimetable();
      fetchSubjectsForBatch();
    } else {
      setTimetable([]);
      setSubjects([]);
    }
  }, [selectedBatchId]);

  const fetchInitialData = async () => {
    try {
      const res = await api.get('/batches');
      setBatches(res.data);
      if (res.data.length > 0) setSelectedBatchId(res.data[0].id);
    } catch (err) {
      console.error('Failed to fetch batches', err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/timetables?batchId=${selectedBatchId}`);
      setTimetable(res.data);
    } catch (err) {
      console.error('Failed to fetch timetable', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsForBatch = async () => {
    try {
      const res = await api.get(`/subjects?batchId=${selectedBatchId}`);
      setSubjects(res.data);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const data = { day, startTime, endTime, subjectId, batchId: selectedBatchId };

    try {
      if (editingId) {
        await api.patch(`/timetables/${editingId}`, data);
      } else {
        await api.post('/timetables', data);
      }
      fetchTimetable();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setDay(entry.day);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setSubjectId(entry.subjectId);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await api.delete(`/timetables/${id}`);
      fetchTimetable();
    } catch (err) {
      alert('Failed to delete entry');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setDay('MONDAY');
    setStartTime('09:00');
    setEndTime('10:00');
    setSubjectId('');
    setError('');
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setToast(null);

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const res = await api.post('/timetables/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setToast({ message: res.data.message, type: 'success' });
      setShowImportModal(false);
      setImportFile(null);
      fetchInitialData();
      if (selectedBatchId) fetchTimetable();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Import failed', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleLinkImport = async (e) => {
    e.preventDefault();
    if (!sheetLink) return;
    
    // Simple logic: send link to backend or fetch frontend
    // Google sheets publish link is actually a CSV
    setImporting(true);
    setToast(null);

    try {
      const res = await api.post('/timetables/bulk-import-link', { url: sheetLink });
      setToast({ message: res.data.message, type: 'success' });
      setShowImportModal(false);
      setSheetLink('');
      fetchInitialData();
      if (selectedBatchId) fetchTimetable();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Link import failed', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedBatchId) return;
    if (!window.confirm('This will delete the current timetable for this batch and generate a new one based on constraints. Continue?')) return;

    setGenerating(true);
    setToast(null);

    try {
      const res = await api.post(`/timetables/generate/${selectedBatchId}`);
      setToast({ message: res.data.message, type: 'success' });
      fetchTimetable();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Generation failed', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const groupTimetableByDay = () => {
    const grouped = {};
    DAYS.forEach(d => grouped[d] = []);
    timetable.forEach(entry => {
      grouped[entry.day].push(entry);
    });
    return grouped;
  };

  const groupedData = groupTimetableByDay();

  return (
    <>
      <div className="toast-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>

      <header className="top-header">
        <h1 className="page-title">Manage Timetable</h1>
        <div className="header-actions" style={{ gap: '12px' }}>
          <select 
            className="form-input" 
            style={{ width: '200px', marginBottom: 0 }}
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
          >
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.branch} {b.semester}/{b.section}</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={() => { setImportMode('file'); setShowImportModal(true); }} style={{ gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Standard CSV
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => { setImportMode('link'); setShowImportModal(true); }} 
            style={{ gap: '8px', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Google Sheets
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ gap: '8px' }}>
            {icons.calendar} Add Slot
          </button>
        </div>
      </header>

      <div className="page-content animate-fade-in">
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)', 
          border: '1px solid var(--border-subtle)',
          marginBottom: '24px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '1.5rem' }}>💡</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '2px' }}>Smart Scheduling Tip</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Avoid manual entry! Use the <strong>Smart Generator</strong> to configure constraints and priorities for an optimized schedule instantly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => window.location.href='/admin/manual-timetable'}>Go to Smart Generator</button>
            <button 
              className="btn btn-primary" 
              style={{ fontSize: '0.75rem', padding: '6px 12px', background: 'var(--primary-600)' }} 
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Auto-Generate Now'}
            </button>
          </div>
        </div>

        {!selectedBatchId ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p>Select a batch to manage its timetable.</p>
          </div>
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '800px', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={{ 
                    position: 'sticky', left: 0, zIndex: 10, 
                    background: 'var(--bg-elevated)', width: '120px',
                    borderRight: '1px solid var(--border-subtle)'
                  }}>Time / Day</th>
                  {DAYS.map(day => (
                    <th key={day} style={{ textAlign: 'center', minWidth: '150px' }}>
                      {day.charAt(0) + day.slice(1).toLowerCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 
                  We'll group by unique time slots 
                  For a cleaner table, we'll find all unique start times
                */}
                {[...new Set(timetable.map(t => t.startTime))].sort().map(time => (
                  <tr key={time}>
                    <td style={{ 
                      position: 'sticky', left: 0, zIndex: 5, 
                      background: 'var(--bg-card)', fontWeight: 700, 
                      color: 'var(--primary-400)', fontSize: '0.85rem',
                      borderRight: '1px solid var(--border-subtle)',
                      padding: '20px 16px'
                    }}>
                      {time}
                    </td>
                    {DAYS.map(day => {
                      const entry = timetable.find(t => t.day === day && t.startTime === time);
                      return (
                        <td key={`${day}-${time}`} style={{ padding: '8px', borderRight: '1px solid var(--border-subtle)' }}>
                          {entry ? (
                            <div className="animate-fade-in" style={{ 
                              background: 'rgba(255,113,113,0.05)', 
                              border: '1px solid rgba(255,113,113,0.15)',
                              borderRadius: 'var(--radius-md)',
                              padding: '12px',
                              position: 'relative',
                              minHeight: '80px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}>
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{entry.subject.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{entry.subject.code}</span>
                                <span>{entry.endTime}</span>
                              </div>
                              
                              <div style={{ 
                                position: 'absolute', top: '8px', right: '8px', 
                                display: 'flex', gap: '4px', opacity: 0, transition: 'opacity 0.2s'
                              }} className="hover-actions">
                                <button 
                                  onClick={() => handleEdit(entry)}
                                  style={{ background: 'var(--bg-elevated)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-primary)', padding: '4px' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                                <button 
                                  onClick={() => handleDelete(entry.id)}
                                  style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: 'var(--primary-400)', padding: '4px' }}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                              </div>
                              <style>{`
                                td:hover .hover-actions { opacity: 1 !important; }
                              `}</style>
                            </div>
                          ) : (
                            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                              <span style={{ fontSize: '0.7rem' }}>—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {timetable.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📅</div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Empty Schedule</h3>
                <p style={{ fontSize: '0.88rem' }}>No slots scheduled for this batch yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Slot' : 'Add Timetable Slot'}</h3>
              <button className="modal-close" onClick={closeModal}>{icons.close}</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Day</label>
                <select className="form-input" value={day} onChange={(e) => setDay(e.target.value)} required>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select 
                  className="form-input" 
                  value={subjectId} 
                  onChange={(e) => setSubjectId(e.target.value)} 
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
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
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Add Slot'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Bulk Import Timetable</h3>
              <button className="modal-close" onClick={() => { setShowImportModal(false); setImportFile(null); }}>{icons.close}</button>
            </div>
              <div style={{ background: 'var(--bg-elevated)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Required headers:</strong><br/>
                <code>day, startTime, endTime, subjectName, subjectCode, facultyEmail, branch, semester, section</code>
              </div>

              {importMode === 'file' ? (
                <form onSubmit={handleBulkImport}>
                   <div className="form-group">
                    <label className="form-label">CSV File</label>
                    <input type="file" accept=".csv" className="form-input" onChange={(e) => setImportFile(e.target.files[0])} required />
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowImportModal(false); setImportFile(null); }} disabled={importing}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={importing || !importFile}>
                      {importing ? 'Processing...' : 'Upload & Process'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLinkImport}>
                   <div className="form-group">
                    <label className="form-label">Google Sheet CSV URL</label>
                    <input 
                      type="url" 
                      className="form-input" 
                      placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv" 
                      value={sheetLink}
                      onChange={(e) => setSheetLink(e.target.value)}
                      required 
                    />
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '12px', 
                      background: 'rgba(251, 191, 36, 0.05)', 
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      lineHeight: '1.4',
                      color: 'var(--accent-amber)'
                    }}>
                      <strong>How to get the link:</strong><br/>
                      1. In Google Sheets: <code>File {'>'} Share {'>'} Publish to Web</code><br/>
                      2. Select <code>Link</code> and <code>Comma-separated values (.csv)</code><br/>
                      3. Click <code>Publish</code> and copy the link here.
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowImportModal(false); setSheetLink(''); }} disabled={importing}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={importing || !sheetLink}>
                      {importing ? 'Connecting...' : 'Fetch & Sync'}
                    </button>
                  </div>
                </form>
              )}
          </div>
        </div>
      )}
    </>
  );
}

export default AdminTimetable;
