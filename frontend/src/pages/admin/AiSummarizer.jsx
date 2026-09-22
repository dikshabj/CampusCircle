import { useState } from 'react';
import icons from '../../components/Icons';

// Mock data for Phase 1
const SUGGESTED_QUERIES = [
  "What are the most lacking skills among 3rd-year students?",
  "Which 4 students would make the best team for a Full-Stack Web Development hackathon based on their skills?",
  "How many students meet the minimum skill requirements (React, Node, SQL) for upcoming campus placements?",
  "What is the most recently added skill across all students this month?"
];

const MOCK_RESPONSE = {
  summary: "Based on the data, I found 12 students who meet the criteria for Full-Stack Web Development. I have selected the top 4 candidates whose complementary skills make the most balanced team. Alice excels in Frontend (React), Bob is a Backend specialist (Node.js), Charlie is strong in Databases (SQL/MongoDB), and David is great at DevOps and Deployment (AWS/Docker).",
  data: [
    { name: "Alice Sharma", roll: "CSE001", skills: ["React", "UI/UX", "Figma"] },
    { name: "Bob Kumar", roll: "CSE042", skills: ["Node.js", "Express", "TypeScript"] },
    { name: "Charlie Singh", roll: "CSE015", skills: ["SQL", "MongoDB", "Python"] },
    { name: "David Verma", roll: "CSE088", skills: ["AWS", "Docker", "Linux"] }
  ]
};

function AiSummarizer() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3000/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${localStorage.getItem('token')}` // Uncomment if endpoint is protected
        },
        body: JSON.stringify({ question: query }),
      });
      
      const data = await response.json();
      
      setResult({
        summary: data.answer || "No summary provided.",
        data: Array.isArray(data.rawData) ? data.rawData : [],
        sql: data.sql
      });
    } catch (error) {
      console.error("AI Error:", error);
      setResult({
        summary: "Something went wrong while fetching data. Check backend connection.",
        data: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedClick = (text) => {
    setQuery(text);
  };

  return (
    <>
      <header className="top-header">
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.8rem' }}>✨</span> AI Skills Summarizer
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Ask questions in plain English to analyze student skills and identify gaps instantly.
        </p>
      </header>

      <div className="page-content animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Search / Chat Input Box */}
        <div className="card" style={{ 
          background: 'linear-gradient(145deg, var(--bg-elevated) 0%, rgba(14,165,233,0.05) 100%)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleQuery} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-400)' }}>
                {icons.sparkles}
              </span>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Ask something like: 'Which students know React and Node.js?'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ 
                  paddingLeft: '48px', marginBottom: 0, 
                  height: '56px', fontSize: '1.05rem',
                  borderRadius: '30px', border: '2px solid transparent',
                  background: 'var(--bg-input)'
                }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!query.trim() || isLoading}
              style={{ borderRadius: '30px', padding: '0 30px', fontSize: '1.05rem', fontWeight: 600 }}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div>
              ) : 'Analyze'}
            </button>
          </form>

          {/* Suggested Queries */}
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Suggested Prompts
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SUGGESTED_QUERIES.map((q, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSuggestedClick(q)}
                  style={{
                    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)', padding: '8px 16px',
                    borderRadius: '20px', fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.2s ease', textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-400)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Area */}
        {result && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            
            {/* AI Summary Text */}
            <div className="card" style={{ 
              borderLeft: '4px solid var(--primary-500)',
              background: 'rgba(14,165,233,0.03)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary-400)', fontWeight: 600 }}>
                {icons.sparkles} AI Summary
              </div>
              <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                {result.summary}
              </p>
            </div>

            {/* Generated SQL Reference */}
            {result.sql && (
              <div className="card" style={{ padding: 'var(--space-md)', background: 'var(--bg-elevated)', borderLeft: '4px solid var(--text-muted)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>Executed SQL (Generated by AI):</div>
                <code style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.sql}</code>
              </div>
            )}

            {/* Data Table */}
            {result.data && result.data.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Raw Data Source</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>The data used by the AI to generate the summary above.</p>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        {Object.keys(result.data[0]).map((key) => (
                          <th key={key} style={{ textTransform: 'capitalize' }}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.data.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => (
                            <td key={j}>
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default AiSummarizer;
