import React, { useState } from 'react';
import axios from 'axios';
import icons from '../../components/Icons';

export default function AiSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setMessage('');
    
    try {
      // API call to our new Semantic Search backend route
      const res = await axios.post('http://localhost:3000/api/ai/search-students', { query });
      setResults(res.data);
      if (res.data.length === 0) setMessage('No matching students found.');
    } catch (err) {
      console.error(err);
      setMessage('Search failed. Make sure backend is running.');
    }
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage('Syncing students to AI Vector Database...');
    try {
      const res = await axios.post('http://localhost:3000/api/ai/sync-students');
      setMessage(res.data.message || 'Database Synced!');
    } catch (err) {
      console.error(err);
      setMessage('Failed to sync database.');
    }
    setSyncing(false);
  };

  return (
    <div style={styles.container}>
      
      {/* Header Area */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            <span style={{ marginRight: '15px', display: 'flex', alignItems: 'center' }}>{icons.sparkles}</span>
            AI Semantic Match-Maker
          </h1>
          <p style={styles.subtitle}>Find the perfect students based on real meaning, not just keywords.</p>
        </div>
        
        <button 
          onClick={handleSync} 
          disabled={syncing}
          style={syncing ? { ...styles.syncBtn, opacity: 0.7 } : styles.syncBtn}
        >
          {syncing ? 'Syncing...' : 'Sync Database to AI'}
        </button>
      </div>

      {message && <div style={styles.messageBox}>{message}</div>}

      {/* Search Box */}
      <form onSubmit={handleSearch} style={styles.searchForm}>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Find me a student who knows React and UI Design for a hackathon..."
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchBtn} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results Area */}
      <div style={styles.resultsGrid}>
        {results.map((student, index) => {
          // Convert similarity score to percentage (e.g. 0.48 -> 48%)
          const matchScore = Math.round(student.similarity * 100);
          
          return (
            <div key={index} style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardName}>{student.metadata.name}</h3>
                <div style={styles.badge}>{matchScore}% Match</div>
              </div>
              <p style={styles.cardContent}>{student.content}</p>
            </div>
          );
        })}
      </div>

    </div>
  );
}

// Inline CSS for a premium Glassmorphism and Neon feel
const styles = {
  container: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "'Inter', sans-serif",
    animation: 'fadeIn 0.5s ease-in',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '800',
    color: '#1a1a2e',
    margin: '0 0 10px 0',
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(45deg, #6a11cb, #2575fc)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#666',
    margin: 0,
  },
  syncBtn: {
    background: '#1a1a2e',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  },
  messageBox: {
    padding: '15px',
    background: '#e3f2fd',
    color: '#0d47a1',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: '500',
  },
  searchForm: {
    display: 'flex',
    gap: '15px',
    marginBottom: '40px',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    padding: '20px 25px',
    fontSize: '1.2rem',
    borderRadius: '16px',
    border: '2px solid transparent',
    background: '#fff',
    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  searchBtn: {
    background: 'linear-gradient(45deg, #6a11cb, #2575fc)',
    color: 'white',
    border: 'none',
    padding: '0 40px',
    borderRadius: '16px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 10px 20px rgba(37, 117, 252, 0.3)',
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '25px',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '25px',
    border: '1px solid rgba(255,255,255,0.5)',
    boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  cardName: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#2d3436',
  },
  badge: {
    background: 'linear-gradient(45deg, #00b894, #00cec9)',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    boxShadow: '0 4px 10px rgba(0, 184, 148, 0.3)',
  },
  cardContent: {
    color: '#636e72',
    lineHeight: '1.6',
    fontSize: '1.05rem',
  }
};
