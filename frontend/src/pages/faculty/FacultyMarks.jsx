import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';
import Toast from '../../components/Toast';

const EXAM_TYPES = ['MST1', 'MST2', 'FINAL'];

function FacultyMarks() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examType, setExamType] = useState('MST1');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { studentId: number }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }

  // CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // { success: number, failed: number }

  useEffect(() => {
    fetchMySubjects();
  }, []);

  useEffect(() => {
    if (selectedSubjectId && examType) {
      fetchMarksData();
    }
  }, [selectedSubjectId, examType]);

  const fetchMySubjects = async () => {
    try {
      const res = await api.get('/subjects');
      setSubjects(res.data);
      if (res.data.length > 0) setSelectedSubjectId(res.data[0].id);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  const fetchMarksData = async () => {
    setLoading(true);
    setToast(null);
    try {
      // 1. Get all students for batch
      const studentsRes = await api.get(`/attendance/students/${selectedSubjectId}`);
      
      // 2. Get existing marks
      const marksRes = await api.get(`/marks/subject?subjectId=${selectedSubjectId}&examType=${examType}`);
      
      const existingMarks = {};
      marksRes.data.forEach(m => existingMarks[m.studentId] = m.marks);
      
      setStudents(studentsRes.data);
      setMarks(existingMarks);
    } catch (err) {
      console.error('Failed to fetch marks', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, val) => {
    const num = parseFloat(val);
    setMarks(prev => ({ ...prev, [studentId]: isNaN(num) ? 0 : num }));
  };

  const handleSave = async () => {
    setSaving(true);
    setToast(null);
    const records = Object.entries(marks).map(([studentId, marks]) => ({
      studentId, marks
    }));

    try {
      await api.post('/marks/save', {
        subjectId: selectedSubjectId,
        examType,
        records
      });
      setToast({ message: 'Marks updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update marks', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    setToast(null);

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('subjectId', selectedSubjectId);
    formData.append('examType', examType);

    try {
      const res = await api.post('/marks/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult({ success: res.data.successCount, failed: res.data.failCount });
      setToast({ message: `Bulk upload complete. ${res.data.successCount} succeeded.`, type: 'success' });
      fetchMarksData(); // Refresh list
      if (res.data.failCount === 0) closeImportModal();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Bulk upload failed', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
  };

  return (
    <>
      <div className="toast-container">
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>

      <header className="top-header">
        <h1 className="page-title">Grade Students</h1>
        <div className="header-actions" style={{ gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowImportModal(true)}
            style={{ gap: '8px' }}
            disabled={!selectedSubjectId}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Bulk Upload
          </button>
          <select 
            className="form-input" 
            style={{ width: '180px', marginBottom: 0 }}
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select 
            className="form-input" 
            style={{ width: '120px', marginBottom: 0 }}
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          >
            {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
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
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', fontWeight: 700 }}>
                {examType} Marks Entry - {students.length} Students
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>Roll Number</th>
                    <th>Name</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Marks (0-100)</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 600 }}>{student.rollNumber}</td>
                      <td>{student.name}</td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number" 
                          className="form-input" 
                          style={{ width: '80px', textAlign: 'center', marginBottom: 0 }}
                          value={marks[student.id] || ''}
                          onChange={(e) => handleMarkChange(student.id, e.target.value)}
                          min="0"
                          max="100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ padding: 'var(--space-lg)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                 <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                   {saving ? 'Saving...' : 'Update Result'}
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Bulk Import Marks - {examType}</h3>
              <button className="modal-close" onClick={closeImportModal}>{icons.close}</button>
            </div>
            <form onSubmit={handleBulkUpload}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                Upload a CSV file for <strong>{subjects.find(s=>s.id===selectedSubjectId)?.name}</strong>.<br/>
                Headers expected: <code>rollNumber, marks</code>
              </p>

              <div className="form-group">
                <label className="form-label">CSV File</label>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="form-input" 
                  onChange={(e) => setImportFile(e.target.files[0])} 
                  required
                />
              </div>

              {importResult && (
                <div style={{ 
                  padding: '10px', 
                  borderRadius: '4px', 
                  background: importResult.failed === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                  color: importResult.failed === 0 ? 'var(--success)' : 'var(--accent-amber)',
                  fontSize: '0.82rem',
                  marginBottom: '15px',
                  fontWeight: 700
                }}>
                  ✅ Success: {importResult.success} | ❌ Failed: {importResult.failed}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeImportModal} disabled={importing}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={importing || !importFile}>
                  {importing ? 'Processing...' : 'Upload & Process'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default FacultyMarks;
