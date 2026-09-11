import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import icons from '../../components/Icons';
import Toast from '../../components/Toast';

const ManualTimetableGenerator = () => {
    const [loading, setLoading] = useState(false);
    const [batches, setBatches] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [toast, setToast] = useState(null);
    const [unscheduledClasses, setUnscheduledClasses] = useState([]);
    
    const subjectFileInputRef = useRef(null);
    const facultyFileInputRef = useRef(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [batchesRes, facultiesRes] = await Promise.all([
                api.get('/batches'),
                api.get('/users?role=FACULTY')
            ]);
            setBatches(batchesRes.data);
            setFaculties(facultiesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setToast({ message: 'Failed to load initial data', type: 'error' });
        }
    };

    const handleBatchChange = async (e) => {
        const batchId = e.target.value;
        setSelectedBatch(batchId);
        setUnscheduledClasses([]);
        if (batchId) {
            try {
                const res = await api.get(`/subjects?batchId=${batchId}`);
                setSubjects(res.data.map(s => ({
                    ...s,
                    priority: s.priority || 1,
                    weeklyTarget: s.weeklyTarget || 3,
                    isLab: s.isLab || false,
                    facultyId: s.facultyId || ''
                })));
            } catch (error) {
                setToast({ message: 'Failed to load subjects for this batch', type: 'error' });
            }
        } else {
            setSubjects([]);
        }
    };

    const handleSubjectCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
            const headers = rows[0].map(h => h.toLowerCase());
            const dataRows = rows.slice(1).filter(row => row.length > 1);

            if (!selectedBatch) {
                setToast({ message: 'Please select a batch first', type: 'warning' });
                return;
            }

            try {
                setLoading(true);
                let importedCount = 0;
                for (const row of dataRows) {
                    const sub = {};
                    headers.forEach((header, i) => {
                        if (header === 'priority') sub[header] = parseInt(row[i]) || 1;
                        else if (header === 'islab') sub[header] = row[i]?.toLowerCase() === 'true';
                        else if (header === 'weeklytarget') sub[header] = parseInt(row[i]) || 3;
                        else sub[header] = row[i];
                    });

                    await api.post('/subjects', {
                        name: sub.name || sub.subjectname,
                        code: sub.code || sub.subjectcode,
                        batchId: selectedBatch,
                        priority: sub.priority,
                        isLab: sub.islab,
                        weeklyTarget: sub.weeklytarget
                    });
                    importedCount++;
                }
                setToast({ message: `${importedCount} subjects imported!`, type: 'success' });
                handleBatchChange({ target: { value: selectedBatch } }); 
            } catch (error) {
                setToast({ message: error.response?.data?.message || 'Error importing subjects', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleFacultyCsvUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('role', 'FACULTY');

            try {
                setLoading(true);
                const res = await api.post('/users/bulk-upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setToast({ message: res.data.message, type: 'success' });
                fetchInitialData(); // Refresh faculty list
            } catch (error) {
                setToast({ message: 'Faculty import failed', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        reader.readAsText(file);
    };

    const handleUpdateSubject = (index, field, value) => {
        const updated = [...subjects];
        updated[index][field] = value;
        setSubjects(updated);
    };

    const handleSaveAndGenerate = async () => {
        if (!selectedBatch) return;
        setLoading(true);
        setUnscheduledClasses([]);

        try {
            const updates = subjects.map(s => ({
                id: s.id,
                priority: parseInt(s.priority),
                facultyId: s.facultyId || null,
                isLab: s.isLab,
                weeklyTarget: parseInt(s.weeklyTarget)
            }));

            await api.post('/subjects/bulk-update', updates);
            const genRes = await api.post(`/timetables/generate/${selectedBatch}`);
            
            if (genRes.data.unscheduled) {
                setUnscheduledClasses(genRes.data.unscheduled);
                setToast({ 
                    message: `Generated with ${genRes.data.unscheduled.length} unscheduled classes.`, 
                    type: 'warning' 
                });
            } else {
                setToast({ message: 'Timetable generated perfectly!', type: 'success' });
            }
        } catch (error) {
            console.error('Generation Error:', error);
            setToast({ message: error.response?.data?.message || 'Failed to generate', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div className="toast-container">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>

            <header className="top-header" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', margin: '-24px -24px 24px -24px', padding: '24px' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ color: 'var(--primary-400)' }}>{icons.sparkles}</span>
                        Smart Timetable Generator
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Configure subjects, priorities, and faculty for optimized scheduling.</p>
                </div>
                <div className="header-actions" style={{ gap: '12px' }}>
                    <input type="file" ref={facultyFileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleFacultyCsvUpload} />
                    <input type="file" ref={subjectFileInputRef} style={{ display: 'none' }} accept=".csv" onChange={handleSubjectCsvUpload} />
                    
                    <button className="btn btn-secondary" onClick={() => facultyFileInputRef.current.click()} style={{ fontSize: '0.8rem' }}>
                        {icons.users} Import Faculty
                    </button>
                    <button className="btn btn-secondary" onClick={() => subjectFileInputRef.current.click()} disabled={!selectedBatch} style={{ fontSize: '0.8rem' }}>
                        {icons.upload} Import Subjects
                    </button>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleSaveAndGenerate} 
                        disabled={loading || !selectedBatch || subjects.length === 0}
                        style={{ padding: '10px 24px', fontWeight: 600, boxShadow: 'var(--shadow-glow)' }}
                    >
                        {loading ? 'Processing...' : 'Save & Generate'}
                    </button>
                </div>
            </header>

            <div className="page-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Batch Selection Card */}
                        <section className="card" style={{ padding: '20px' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {icons.batch} Target Batch
                                </label>
                                <select 
                                    className="form-input" 
                                    value={selectedBatch} 
                                    onChange={handleBatchChange}
                                    style={{ maxWidth: '100%' }}
                                >
                                    <option value="">-- Choose Batch to Configure --</option>
                                    {batches.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.branch} | Semester {b.semester} | Section {b.section}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </section>

                        {/* Subjects Grid */}
                        {subjects.length > 0 ? (
                            <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Subject Configuration</h3>
                                </div>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th style={{ width: '110px' }}>Priority</th>
                                            <th style={{ width: '100px' }}>Target</th>
                                            <th style={{ width: '90px' }}>Type</th>
                                            <th>Assigned Faculty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjects.map((sub, index) => (
                                            <tr key={sub.id}>
                                                <td>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sub.code}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub.name}</div>
                                                </td>
                                                <td>
                                                    <select 
                                                        className="form-input" 
                                                        value={sub.priority} 
                                                        onChange={(e) => handleUpdateSubject(index, 'priority', e.target.value)}
                                                        style={{ marginBottom: 0, padding: '4px 8px' }}
                                                    >
                                                        {[...Array(10)].map((_, i) => (
                                                            <option key={i+1} value={i+1}>{i+1}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input 
                                                        type="number" 
                                                        className="form-input" 
                                                        min="1" max="10" 
                                                        value={sub.weeklyTarget} 
                                                        onChange={(e) => handleUpdateSubject(index, 'weeklyTarget', e.target.value)}
                                                        style={{ marginBottom: 0, padding: '4px 8px' }}
                                                    />
                                                </td>
                                                <td>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                        <input 
                                                            type="checkbox" 
                                                            checked={sub.isLab} 
                                                            onChange={(e) => handleUpdateSubject(index, 'isLab', e.target.checked)}
                                                        />
                                                        {sub.isLab ? 'Lab' : 'Class'}
                                                    </label>
                                                </td>
                                                <td>
                                                    <select 
                                                        className="form-input" 
                                                        value={sub.facultyId || ''} 
                                                        onChange={(e) => handleUpdateSubject(index, 'facultyId', e.target.value)}
                                                        style={{ marginBottom: 0, padding: '4px 8px' }}
                                                    >
                                                        <option value="">-- No Faculty --</option>
                                                        {faculties.map(f => (
                                                            <option key={f.id} value={f.id}>
                                                                {f.name} {f.name.toUpperCase().includes('DCPD') ? '(Trainer)' : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </section>
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: '80px 20px', border: '2px dashed var(--border-subtle)', background: 'transparent' }}>
                                <div style={{ fontSize: '3.5rem', marginBottom: '20px', opacity: 0.3 }}>{icons.calendar}</div>
                                <h3 style={{ color: 'var(--text-secondary)' }}>No Subjects Loaded</h3>
                                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '10px auto' }}>
                                    {selectedBatch 
                                        ? 'This batch has no subjects. Use the "Import Subjects" button to load them from CSV.' 
                                        : 'Please select a batch from the dropdown to start the configuration.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Status & Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <section className="card" style={{ background: 'var(--bg-elevated)' }}>
                            <h4 style={{ marginBottom: '16px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rules & Hints</h4>
                            <ul style={{ paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <li><strong>Priority:</strong> Subjects with priority 10 are scheduled first.</li>
                                <li><strong>Labs:</strong> Always take 2 consecutive slots in the timetable.</li>
                                <li><strong>Target:</strong> Number of classes per week the algorithm will try to fit.</li>
                                <li><strong>Conflicts:</strong> If a faculty is busy in another batch, the algorithm will skip that slot.</li>
                            </ul>
                        </section>

                        {unscheduledClasses.length > 0 && (
                            <section className="card" style={{ border: '1px solid var(--accent-rose)', background: 'rgba(251, 113, 133, 0.05)' }}>
                                <h4 style={{ color: 'var(--accent-rose)', marginBottom: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    ⚠️ Unscheduled Classes
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {unscheduledClasses.map((msg, i) => (
                                        <div key={i} style={{ fontSize: '0.75rem', color: 'var(--text-primary)', padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                            {msg}
                                        </div>
                                    ))}
                                </div>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                                    Tip: Try increasing the priority or changing the faculty.
                                </p>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualTimetableGenerator;
