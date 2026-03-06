import { useState, useEffect } from 'react';
import api from '../services/api';
import icons from './Icons';

function CommonPosts({ role }) {
  const [posts, setPosts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}') || {};

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [batchId, setBatchId] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [files, setFiles] = useState([]);

  // Comments state
  const [commentInputs, setCommentInputs] = useState({});
  const [commentingId, setCommentingId] = useState(null);

  useEffect(() => {
    fetchPosts();
    if (role === 'ADMIN' || role === 'FACULTY') {
      fetchBatches();
    }
  }, []);

  const fetchPosts = async () => {
    try {
      const query = user.batchId ? `?batchId=${user.batchId}` : '';
      const res = await api.get(`/posts${query}`);
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (batchId) formData.append('batchId', batchId);
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }

    try {
      if (editingId) {
        await api.patch(`/posts/${editingId}`, formData);
      } else {
        await api.post('/posts', formData);
      }
      fetchPosts();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save post');
    }
  };

  const handleCommentSubmit = async (postId) => {
      const cContent = commentInputs[postId];
      if (!cContent?.trim()) return;
      
      setCommentingId(postId);
      try {
          await api.post(`/posts/${postId}/comments`, { content: cContent });
          setCommentInputs({ ...commentInputs, [postId]: '' });
          fetchPosts(); // refresh to show new comment
      } catch (err) {
          alert('Failed to add comment');
      } finally {
          setCommentingId(null);
      }
  };

  const handleEdit = (post) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setBatchId(post.batchId || '');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      fetchPosts();
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setBatchId('');
    setFiles([]);
    setError('');
  };

  const canManage = (post) => {
    return role === 'ADMIN' || (role === 'FACULTY' && post.authorId === user.id);
  };

  return (
    <>
      <header className="top-header">
        <h1 className="page-title">Announcements</h1>
        {(role === 'ADMIN' || role === 'FACULTY') && (
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setShowModal(true)} style={{ gap: '8px' }}>
              {icons.megaphone} Create Announcement
            </button>
          </div>
        )}
      </header>

      <div className="page-content animate-fade-in">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', maxWidth: '800px', margin: '0 auto' }}>
            {posts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                No announcements yet.
              </div>
            ) : (
              posts.map(post => (
                <div key={post.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: post.batchId ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)', color: post.batchId ? 'var(--accent-sky)' : 'var(--primary-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {post.batchId ? 'Batch Bound' : 'Global Update'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{post.title}</h3>
                    </div>
                    {canManage(post) && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="btn-icon btn-ghost" onClick={() => handleEdit(post)}>{icons.edit}</button>
                        <button className="btn-icon btn-ghost" style={{ color: 'var(--primary-400)' }} onClick={() => handleDelete(post.id)}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                    {post.content}
                  </p>
                  
                  {post.attachments && post.attachments.length > 0 && (
                      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {post.attachments.map((att, idx) => (
                              <a 
                                key={idx} 
                                href={att} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--accent-sky)', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)' }}
                              >
                                  📎 Attachment {idx + 1}
                              </a>
                          ))}
                      </div>
                  )}

                  <div style={{ marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'white', fontWeight: 700 }}>
                        {post.author.name[0]}
                     </div>
                     <div style={{ fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{post.author.name}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.75rem' }}>{post.author.role.toLowerCase()}</span>
                     </div>
                  </div>

                  {/* Comments Section */}
                  <div style={{ marginTop: '20px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                      <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>Comments</h4>
                      {post.comments && post.comments.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                              {post.comments.map(c => (
                                  <div key={c.id} style={{ fontSize: '0.85rem' }}>
                                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '8px' }}>{c.author.name}</span>
                                      <span style={{ color: 'var(--text-muted)' }}>{c.content}</span>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>No comments yet.</div>
                      )}
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                          <input 
                              type="text" 
                              className="form-input" 
                              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                              placeholder="Add a comment..." 
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                              onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit(post.id)}
                          />
                          <button 
                              className="btn btn-primary" 
                              style={{ padding: '0 16px', fontSize: '0.85rem' }}
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={commentingId === post.id}
                          >
                              {commentingId === post.id ? '...' : 'Post'}
                          </button>
                      </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal animate-slide-up" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingId ? 'Edit Announcement' : 'Post New Announcement'}</h3>
              <button className="modal-close" onClick={closeModal}>{icons.close}</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  className="form-input" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Upcoming Workshop, Holiday Notice"
                  required 
                />
              </div>

               <div className="form-group">
                <label className="form-label">Content</label>
                <textarea 
                  className="form-input" 
                  style={{ minHeight: '180px', resize: 'vertical' }}
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Detailed announcement content..."
                  required 
                />
              </div>

              <div className="form-group">
                  <label className="form-label">Attachments (Optional)</label>
                  <input 
                      type="file" 
                      className="form-input" 
                      multiple 
                      onChange={(e) => setFiles(e.target.files)} 
                      style={{ padding: '10px' }}
                  />
                  <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Upload PDFs, Images, etc.</small>
              </div>

              {(role === 'ADMIN' || role === 'FACULTY') && (
                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select 
                    className="form-input" 
                    value={batchId} 
                    onChange={(e) => setBatchId(e.target.value)}
                  >
                    <option value="">Global (Everyone)</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.branch} {b.semester}/{b.section}</option>
                    ))}
                  </select>
                </div>
              )}

              {error && (
                <div style={{ color: 'var(--primary-400)', fontSize: '0.8rem', marginTop: '10px' }}>
                  {error}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Publish Announcement'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default CommonPosts;
