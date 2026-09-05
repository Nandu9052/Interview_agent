import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { Clock, ChevronRight, Calendar, Award, Search } from 'lucide-react'

export default function History() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/interviews').then(r => setInterviews(r.data.interviews)).finally(() => setLoading(false))
  }, [])

  const filtered = interviews.filter(i =>
    i.role.toLowerCase().includes(search.toLowerCase()) ||
    i.difficulty.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner spinner-lg" />
    </div>
  )

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2>Interview History</h2>
        <p>Review all your past practice sessions</p>
      </div>

      {interviews.length > 0 && (
        <div className="input-with-icon" style={{ maxWidth: 360, marginBottom: 24 }}>
          <Search size={14} className="input-icon" />
          <input className="input" placeholder="Search by role or difficulty..." value={search}
            onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <div className="empty-state-icon"><Calendar size={28} color="var(--text-muted)" /></div>
          <h3>{interviews.length === 0 ? 'No interviews yet' : 'No matches found'}</h3>
          <p>{interviews.length === 0 ? 'Start your first interview to track your progress' : 'Try a different search term'}</p>
          {interviews.length === 0 && (
            <Link to="/interview/start" className="btn btn-primary" style={{ marginTop: 12 }}>Start Interview</Link>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Difficulty</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(iv => (
                <tr key={iv.id}>
                  <td><strong>{iv.role}</strong></td>
                  <td>
                    <span className={`badge badge-${iv.difficulty === 'Easy' ? 'success' : iv.difficulty === 'Hard' ? 'danger' : 'warning'}`}>
                      {iv.difficulty}
                    </span>
                  </td>
                  <td className="text-muted">{new Date(iv.started_at).toLocaleDateString()}</td>
                  <td className="text-muted">{iv.duration_minutes ? `${iv.duration_minutes}m` : '—'}</td>
                  <td>
                    {iv.status === 'completed' ? (
                      <span style={{ fontWeight: 600, color: iv.overall_score >= 70 ? 'var(--success)' : iv.overall_score >= 50 ? 'var(--warning)' : 'var(--danger)' }}>
                        {iv.overall_score}%
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    {iv.grade ? <span className="badge badge-muted" style={{ fontWeight: 700 }}>{iv.grade}</span> : '—'}
                  </td>
                  <td>
                    <span className={`badge badge-${iv.status === 'completed' ? 'success' : 'accent'}`}>
                      {iv.status}
                    </span>
                  </td>
                  <td>
                    {iv.status === 'completed' && (
                      <Link to={`/interview/${iv.session_id}/report`} className="btn btn-ghost btn-sm">
                        Report <ChevronRight size={12} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .history-table { width: 100%; border-collapse: collapse; }
        .history-table th { padding: 12px 18px; text-align: left; font-size: 11.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border); background: var(--bg-elevated); }
        .history-table td { padding: 14px 18px; font-size: 13.5px; border-bottom: 1px solid var(--border-subtle); vertical-align: middle; }
        .history-table tr:last-child td { border-bottom: none; }
        .history-table tbody tr:hover { background: var(--bg-elevated); }
      `}</style>
    </div>
  )
}
