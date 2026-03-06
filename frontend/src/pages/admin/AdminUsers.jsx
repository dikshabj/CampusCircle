import { useState, useEffect } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';
import Toast from '../../components/Toast';

const ITEMS_PER_PAGE = 10;

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRole, setImportRole] = useState('STUDENT');
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [lastImportedUsers, setLastImportedUsers] = useState(null);
  const [toast, setToast] = useState(null);

  // Tab, Pagination & Search
  const [activeTab, setActiveTab] = useState('STUDENT');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [role, setRole] = useState('STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [isMentor, setIsMentor] = useState(false);
  const [mentorBatchId, setMentorBatchId] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchBatches();
  }, []);

  // Reset page when tab or search changes
  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  // Derived data
  const students = users.filter(u => u.role === 'STUDENT');
  const faculty = users.filter(u => u.role === 'FACULTY');
  
  const filteredList = (activeTab === 'STUDENT' ? students : faculty).filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.rollNumber && u.rollNumber.toLowerCase().includes(q)) ||
      (u.facultyId && u.facultyId.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(currentPage * ITEMS_PER_PAGE, filteredList.length);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      setBatches(res.data);
    } catch (err) {
      console.error('Failed to fetch batches', err);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setToast(null);
    setLastImportedUsers(null);

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('role', importRole);

    try {
      const res = await api.post('/users/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setToast({ message: res.data.message, type: 'success' });
      setLastImportedUsers(res.data.createdUsers);
      fetchUsers();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Upload failed', type: 'error' });
    } finally {
      setImporting(false);
    }
  };

  const downloadCredentials = () => {
    if (!lastImportedUsers) return;
    const headers = ['Email', 'Name', 'ID', 'Password'];
    const rows = lastImportedUsers.map(u => [u.email, u.name, u.id, u.password]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `credentials_${importRole.toLowerCase()}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setLastImportedUsers(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);
    const data = {
      name, role, email: email || undefined,
      password: password || undefined,
      rollNumber: role === 'STUDENT' ? rollNumber : undefined,
      facultyId: role === 'FACULTY' ? facultyId : undefined,
      batchId: role === 'STUDENT' ? batchId : undefined,
      isMentor: role === 'FACULTY' ? isMentor : undefined,
      mentorBatchId: (role === 'FACULTY' && isMentor) ? mentorBatchId : null
    };

    try {
      if (editingId) {
        await api.patch(`/users/${editingId}`, data);
      } else {
        if (!password) { setToast({ message: 'Password is required for new accounts', type: 'error' }); return; }
        await api.post('/users', data);
      }
      setToast({ message: `User ${editingId ? 'updated' : 'created'} successfully!`, type: 'success' });
      fetchUsers();
      closeModal();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Operation failed', type: 'error' });
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setRole(user.role);
    setName(user.name);
    setEmail(user.email || '');
    setRollNumber(user.rollNumber || '');
    setFacultyId(user.facultyId || '');
    setBatchId(user.batchId || '');
    setIsMentor(user.isMentor || false);
    setMentorBatchId(user.mentorBatchId || '');
    setPassword('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setToast({ message: 'User deleted successfully', type: 'success' });
      fetchUsers();
    } catch (err) {
      setToast({ message: 'Failed to delete user', type: 'error' });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setName(''); setEmail(''); setPassword('');
    setRollNumber(''); setFacultyId(''); setBatchId('');
    setIsMentor(false); setMentorBatchId('');
  };

  const openAddUser = () => {
    closeModal();
    setRole(activeTab); // Pre-select based on active tab
    setShowModal(true);
  };

  // ─── RENDER ─────────────────────────────────────────────
  return (
    <>
      <div className="toast-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>

      <header className="top-header">
        <h1 className="page-title">Manage Users</h1>
        <div className="header-actions" style={{ gap: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)} style={{ gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Bulk Import
          </button>
          <button className="btn btn-primary" onClick={openAddUser} style={{ gap: '8px' }}>
            {icons.users} Add {activeTab === 'STUDENT' ? 'Student' : 'Faculty'}
          </button>
        </div>
      </header>

      <div className="page-content animate-fade-in">
        {/* ─── TABS & SEARCH ────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex', gap: '4px',
            background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
            padding: '4px', maxWidth: '340px', flex: 1
          }}>
            {[
              { key: 'STUDENT', label: '👨‍🎓 Students', count: students.length },
              { key: 'FACULTY', label: '👩‍🏫 Faculty', count: faculty.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: '10px 16px', border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: activeTab === tab.key ? 'var(--gradient-primary)' : 'transparent',
                  color: activeTab === tab.key ? 'white' : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)', fontSize: '0.85rem',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 150ms ease',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label} <span style={{
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--bg-elevated)',
                  padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem',
                  marginLeft: '6px'
                }}>{tab.count}</span>
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', flex: 1, maxWidth: '400px', minWidth: '240px' }}>
            <span style={{ 
              position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', display: 'flex'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input 
              type="text" 
              className="form-input" 
              placeholder={`Search ${activeTab.toLowerCase()} by name, email or ID...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '44px', marginBottom: 0 }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  cursor: 'pointer', padding: '4px'
                }}
              >
                {icons.close}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner"></div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>No Results Found</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              We couldn't find any {activeTab.toLowerCase()} matching "<strong>{searchQuery}</strong>".
            </p>
            <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>Clear Search</button>
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>{activeTab === 'STUDENT' ? 'Roll Number' : 'Faculty ID'}</th>
                    <th>{activeTab === 'STUDENT' ? 'Batch' : 'Mentor'}</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email || 'No email'}</div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.8rem', background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px' }}>
                          {u.rollNumber || u.facultyId || '—'}
                        </code>
                      </td>
                      <td>
                        {activeTab === 'STUDENT'
                          ? (u.batch ? `${u.batch.branch} ${u.batch.semester}/${u.batch.section}` : '—')
                          : (u.isMentor
                            ? <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.8rem' }}>✓ Mentor</span>
                            : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>)
                        }
                      </td>
                      <td>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700,
                          background: u.isActivated ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: u.isActivated ? 'var(--accent-emerald)' : '#f59e0b',
                        }}>
                          {u.isActivated ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn-icon btn-ghost" onClick={() => handleEdit(u)} title="Edit">
                            {icons.edit}
                          </button>
                          <button className="btn-icon btn-ghost" style={{ color: 'var(--primary-400)' }} onClick={() => handleDelete(u.id)} title="Delete">
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

            {/* ─── PAGINATION ──────────────────────── */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 'var(--space-lg)', padding: '0 4px'
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Showing {startIdx}–{endIdx} of {filteredList.length} {activeTab === 'STUDENT' ? 'students' : 'faculty'}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span style={{
                    padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center'
                  }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── ADD / EDIT MODAL ────────────────────── */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit User' : 'Add New User'}</h3>
              <button className="modal-close" onClick={closeModal}>{icons.close}</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['STUDENT', 'FACULTY', 'ADMIN'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`btn ${role === r ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ flex: 1, fontSize: '0.75rem', padding: '8px' }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Email (Optional for students)</label>
                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Password {editingId && '(Leave blank to keep same)'}</label>
                <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={!editingId} />
              </div>

              {role === 'STUDENT' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Roll Number</label>
                    <input className="form-input" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Batch</label>
                    <select className="form-input" value={batchId} onChange={(e) => setBatchId(e.target.value)} required>
                      <option value="">Select Batch</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.branch} {b.semester}/{b.section}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {role === 'FACULTY' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Faculty ID</label>
                    <input className="form-input" value={facultyId} onChange={(e) => setFacultyId(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                    <input type="checkbox" id="isMentor" checked={isMentor} onChange={(e) => setIsMentor(e.target.checked)} />
                    <label className="form-label" htmlFor="isMentor" style={{ marginBottom: 0 }}>Assign as Class Mentor</label>
                  </div>
                  {isMentor && (
                    <div className="form-group">
                      <label className="form-label">Mentoring Batch</label>
                      <select className="form-input" value={mentorBatchId} onChange={(e) => setMentorBatchId(e.target.value)} required>
                        <option value="">Select Batch</option>
                        {batches.map(b => (
                          <option key={b.id} value={b.id}>{b.branch} {b.semester}/{b.section}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── IMPORT MODAL ────────────────────────── */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Bulk Import Users</h3>
              <button className="modal-close" onClick={closeImportModal}>{icons.close}</button>
            </div>
            {lastImportedUsers ? (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: 'var(--space-md) 0' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'rgba(16,185,129,0.1)', color: 'var(--accent-emerald)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', margin: '0 auto var(--space-lg)'
                }}>
                  {icons.check}
                </div>
                <h4 style={{ marginBottom: '8px' }}>Import Successful!</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
                  {lastImportedUsers.length} users have been created. Download the credentials file below.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button className="btn btn-primary" onClick={downloadCredentials} style={{ width: '100%', gap: '8px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Credentials (CSV)
                  </button>
                  <button className="btn btn-secondary" onClick={closeImportModal} style={{ width: '100%' }}>Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFileUpload}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
                  <strong>Student CSV:</strong> <code>name, email, rollNumber, branch, semester, section</code><br/>
                  <strong>Faculty CSV:</strong> <code>name, email, facultyId</code><br/>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Batches are auto-created from branch/semester/section.</span><br/>
                  <strong>Default Password:</strong> <code>welcome123</code> (Users must change it on first login)
                </p>

                <div className="form-group">
                  <label className="form-label">Import as</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['STUDENT', 'FACULTY'].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setImportRole(r)}
                        className={`btn ${importRole === r ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: 1, fontSize: '0.8rem' }}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

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

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeImportModal} disabled={importing}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={importing || !importFile}>
                    {importing ? 'Processing...' : 'Upload & Process'}
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

export default AdminUsers;
