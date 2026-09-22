import { useState, useEffect } from 'react';
import icons from '../../components/Icons';
import Toast from '../../components/Toast';

const AVAILABLE_SKILLS = [
  'React', 'Node.js', 'Python', 'Java', 'SQL', 
  'MongoDB', 'AWS', 'Docker', 'C++', 'UI/UX',
  'Figma', 'TypeScript', 'GraphQL', 'Next.js', 'Express'
];

function StudentProfile() {
  const [user, setUser] = useState({});
  const [skills, setSkills] = useState(['React', 'Node.js', 'SQL']); // Mock initial skills
  const [newSkill, setNewSkill] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    // In a real app, fetch from API. For now, get from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(storedUser);
  }, []);

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill) return;
    
    if (skills.includes(newSkill)) {
      setToast({ message: `${newSkill} is already added!`, type: 'error' });
      return;
    }

    setSkills([...skills, newSkill]);
    setNewSkill('');
    setToast({ message: `Skill '${newSkill}' added successfully!`, type: 'success' });
    
    // TODO: In Phase 3, this will call api.post('/users/skills', { skill: newSkill })
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
    setToast({ message: `Skill '${skillToRemove}' removed.`, type: 'success' });
    
    // TODO: In Phase 3, this will call api.delete(`/users/skills/${skillToRemove}`)
  };

  return (
    <>
      <div className="toast-container">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>

      <header className="top-header">
        <h1 className="page-title">My Profile & Skills</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Update your skillset to get better project matches and placement recommendations.
        </p>
      </header>

      <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        
        {/* Profile Info Card */}
        <div className="card" style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'center' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', color: 'white', fontWeight: 'bold'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{user.name || 'Student Name'}</h2>
            <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {user.email || 'student@campus.com'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {user.rollNumber || 'Roll Number: N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Your Technical Skills</h3>
            <span style={{ background: 'rgba(14,165,233,0.1)', color: 'var(--primary-400)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
              {skills.length} Skills Added
            </span>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: 'var(--space-xl)' }}>
            {skills.map(skill => (
              <div key={skill} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                padding: '6px 12px', borderRadius: '20px',
                fontSize: '0.9rem', color: 'var(--text-primary)',
                transition: 'all 0.2s ease'
              }}>
                <span style={{ color: 'var(--accent-emerald)' }}>✓</span>
                {skill}
                <button 
                  onClick={() => handleRemoveSkill(skill)}
                  style={{ 
                    background: 'none', border: 'none', color: 'var(--text-muted)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px', marginLeft: '4px' 
                  }}
                  title={`Remove ${skill}`}
                >
                  {icons.close}
                </button>
              </div>
            ))}
            {skills.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No skills added yet.</p>
            )}
          </div>

          <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', maxWidth: '400px' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>Add a new skill</label>
              <select 
                className="form-input" 
                value={newSkill} 
                onChange={(e) => setNewSkill(e.target.value)}
                style={{ marginBottom: 0 }}
              >
                <option value="">-- Select a Skill --</option>
                {AVAILABLE_SKILLS.filter(s => !skills.includes(s)).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={!newSkill} style={{ padding: '10px 16px' }}>
              Add Skill
            </button>
          </form>
        </div>

      </div>
    </>
  );
}

export default StudentProfile;
