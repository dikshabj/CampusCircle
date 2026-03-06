import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import icons from './Icons';

function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([
    { role: 'assistant', text: 'Hi! I am your Campus AI Assistant. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg = message.trim();
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      setChat(prev => [...prev, { role: 'assistant', text: res.data.message }]);
    } catch (err) {
      console.error('AI Chat Error:', err);
      setChat(prev => [...prev, { role: 'assistant', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      
      {/* Chat Window */}
      {isOpen && (
        <div className="glass-card animate-slide-up" style={{ 
          width: '350px', height: '500px', marginBottom: '15px', 
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)', padding: 0,
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          {/* Header */}
          <div style={{ 
            background: 'var(--gradient-primary)', padding: '15px 20px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '1.2rem' }}>✨</div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>Campus Assistant</div>
                <div style={{ fontSize: '0.65rem', opacity: 0.8 }}>Online · AI Powered</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}>
              {icons.close}
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {chat.map((msg, i) => (
              <div key={i} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '15px 15px 2px 15px' : '15px 15px 15px 2px',
                background: msg.role === 'user' ? 'var(--primary-600)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '0.85rem',
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap',
                border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.05)' : 'none'
              }}>
                {msg.text}
              </div>
            ))}
            {chat.length === 1 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {['Attendance check', 'Next class?', 'My subjects'].map(q => (
                  <button 
                    key={q} 
                    onClick={() => { setMessage(q); /* simulate send button click? No, better just set and let user click or handle manually */ }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--primary-300)', padding: '5px 12px', borderRadius: '15px', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: '15px 15px 15px 2px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Thinking...
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="form-input" 
              style={{ marginBottom: 0, borderRadius: '20px', fontSize: '0.85rem' }}
              placeholder="Ask anything..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '38px', height: '38px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              🚀
            </button>
          </form>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'var(--gradient-primary)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
          transition: 'all 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
      >
        {isOpen ? (
          <span style={{ fontSize: '1.5rem', color: 'white' }}>✕</span>
        ) : (
          <span style={{ fontSize: '1.8rem' }}>✨</span>
        )}
      </button>

    </div>
  );
}

export default AiAssistant;
