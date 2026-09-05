import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import {
  Brain, Play, ChevronRight, Sparkles, Building2,
  BookOpen, CheckCircle2, Clock, Target, Loader2, Eye
} from 'lucide-react'
import './RAGPreview.css'

export default function RAGPreview() {
  const { user } = useAuth()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedRole, setSelectedRole] = useState(user?.role || 'Software Engineer')
  const [selectedDiff, setSelectedDiff] = useState('Medium')
  const [expandedQ, setExpandedQ] = useState(null)

  const ROLES = ['Software Engineer', 'Data Scientist', 'Frontend Developer', 'DevOps Engineer', 'Product Manager', 'ML Engineer']

  const fetchPreview = async () => {
    setLoading(true)
    try {
      const r = await api.post('/rag/preview-questions', {
        role: selectedRole,
        difficulty: selectedDiff,
        topics: [],
      })
      setData(r.data)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPreview() }, [selectedRole, selectedDiff])

  const startWithRole = async () => {
    const r = await api.post('/interviews/start', {
      role: selectedRole,
      difficulty: selectedDiff,
      topics: data?.questions?.map(q => q.category).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3) || [],
    })
    nav(`/interview/${r.data.interview.session_id}`)
  }

  const ic = data?.industry_context || {}

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-accent" style={{ gap: 5 }}>
                <Sparkles size={11} /> RAG-Powered
              </span>
              {data?.personalized && (
                <span className="badge badge-success">Resume Personalized</span>
              )}
            </div>
            <h2>Interview Preview</h2>
            <p>Questions retrieved from our knowledge base, tailored to your profile</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={startWithRole}>
            <Play size={15} /> Start This Interview
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rag-filters">
        <div className="rag-filter-group">
          <label>Role</label>
          <div className="rag-filter-chips">
            {ROLES.map(r => (
              <button key={r}
                className={`rag-chip${selectedRole === r ? ' active' : ''}`}
                onClick={() => setSelectedRole(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="rag-filter-group">
          <label>Difficulty</label>
          <div className="rag-filter-chips">
            {['Easy', 'Medium', 'Hard'].map(d => (
              <button key={d}
                className={`rag-chip${selectedDiff === d ? ' active' : ''} rag-chip-${d.toLowerCase()}`}
                onClick={() => setSelectedDiff(d)}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="spinner spinner-lg" style={{ marginBottom: 16 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Retrieving from knowledge base...</p>
          </div>
        </div>
      ) : (
        <div className="rag-layout">
          {/* Questions list */}
          <div className="rag-questions">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4>{data?.total || 0} Curated Questions</h4>
              <span className="badge badge-muted">For {selectedRole}</span>
            </div>
            {(data?.questions || []).length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><BookOpen size={28} color="var(--text-muted)" /></div>
                <h3>No questions found</h3>
                <p>Try a different role or difficulty level</p>
              </div>
            ) : (
              <div className="rag-question-list">
                {data.questions.map((q, i) => (
                  <div key={q.id} className={`rag-question-card${expandedQ === i ? ' expanded' : ''}`}
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}>
                    <div className="rag-q-header">
                      <div className="rag-q-number">{String(i + 1).padStart(2, '0')}</div>
                      <div className="rag-q-content">
                        <div className="rag-q-meta">
                          <span className="badge badge-muted">{q.category}</span>
                          <span className={`badge badge-${q.difficulty === 'Easy' ? 'success' : q.difficulty === 'Hard' ? 'danger' : 'warning'}`}>
                            {q.difficulty}
                          </span>
                          <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{q.type}</span>
                        </div>
                        <p className="rag-q-text">{q.question}</p>
                      </div>
                      <Eye size={14} color="var(--text-muted)" />
                    </div>

                    {expandedQ === i && (
                      <div className="rag-q-expanded fade-in">
                        {q.model_answer && (
                          <div className="rag-q-model-answer">
                            <div className="rag-q-section-title">
                              <CheckCircle2 size={12} color="var(--success)" /> Model Answer
                            </div>
                            <p>{q.model_answer}</p>
                          </div>
                        )}
                        {q.tips && (
                          <div className="rag-q-tip">
                            <div className="rag-q-section-title">
                              <Brain size={12} color="var(--accent)" /> Interview Tip
                            </div>
                            <p>{q.tips}</p>
                          </div>
                        )}
                        {q.keywords?.length > 0 && (
                          <div>
                            <div className="rag-q-section-title">Key Concepts</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                              {q.keywords.map(kw => <span key={kw} className="badge badge-muted">{kw}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Industry sidebar */}
          <div className="rag-sidebar">
            {ic.role && (
              <div className="card rag-industry-card">
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                  <Building2 size={16} color="var(--accent)" />
                  <h4>Industry Expectations</h4>
                </div>

                <div className="rag-industry-section">
                  <div className="rag-industry-label">KEY SKILLS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(ic.key_skills || []).map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                  </div>
                </div>

                <div className="rag-industry-section">
                  <div className="rag-industry-label">INTERVIEW ROUNDS</div>
                  {(ic.typical_rounds || []).map((r, i) => (
                    <div key={i} className="rag-round-item">
                      <span className="rag-round-num">{i + 1}</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {ic.avg_interview_duration && (
                  <div className="rag-industry-section">
                    <div className="rag-industry-label">TYPICAL DURATION</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                      <Clock size={13} color="var(--text-muted)" />
                      {ic.avg_interview_duration}
                    </div>
                  </div>
                )}

                {ic.success_tips && (
                  <div className="rag-industry-section">
                    <div className="rag-industry-label">SUCCESS TIP</div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, borderLeft: '3px solid var(--accent)', paddingLeft: 10 }}>
                      {ic.success_tips}
                    </p>
                  </div>
                )}

                {(ic.prep_resources || []).length > 0 && (
                  <div className="rag-industry-section">
                    <div className="rag-industry-label">PREP RESOURCES</div>
                    {ic.prep_resources.map(r => (
                      <div key={r} style={{ fontSize: 12.5, color: 'var(--text-secondary)', padding: '3px 0' }}>· {r}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button className="btn btn-primary w-full btn-lg" onClick={startWithRole}>
              <Play size={15} /> Start Practice Session
            </button>
            <Link to="/interview/start" className="btn btn-secondary w-full">
              Custom Setup <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
