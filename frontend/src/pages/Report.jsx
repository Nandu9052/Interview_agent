import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { Award, TrendingUp, CheckCircle2, AlertCircle, ArrowRight, RotateCcw, Download, Star } from 'lucide-react'
import './Report.css'

const GRADE_COLORS = { A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }

function GradeCircle({ grade, score }) {
  const color = GRADE_COLORS[grade] || '#6c63ff'
  return (
    <div className="grade-circle" style={{ '--grade-color': color }}>
      <div className="grade-letter" style={{ color }}>{grade}</div>
      <div className="grade-score">{score}%</div>
    </div>
  )
}

export default function Report() {
  const { sessionId } = useParams()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/interviews/${sessionId}`).then(r => {
      if (r.data.interview.status !== 'completed') {
        nav(`/interview/${sessionId}`)
        return
      }
      setData(r.data.interview)
    }).finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner spinner-lg" />
    </div>
  )
  if (!data) return null

  const report = data.report || {}
  const skills = report.skill_scores || {}

  const radarData = Object.entries(skills).map(([key, val]) => ({
    subject: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    value: val,
    fullMark: 100,
  }))

  const questionScores = (data.questions || []).map((q, i) => ({
    name: `Q${i + 1}`,
    score: Math.round((q.score / 10) * 100),
  }))

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>Interview Report</h2>
            <p>{data.role} · {data.difficulty} · {new Date(data.started_at).toLocaleDateString()}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/interview/start" className="btn btn-secondary">
              <RotateCcw size={14} /> Practice Again
            </Link>
            <Link to="/analytics" className="btn btn-primary">
              View Analytics <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Top summary */}
      <div className="report-summary">
        <div className="report-grade-section">
          <GradeCircle grade={data.grade || 'B'} score={data.overall_score || 0} />
          <div>
            <div className={`report-recommendation report-rec-${(report.recommendation || 'Consider').toLowerCase().replace(' ', '-')}`}>
              {report.recommendation || 'Consider'}
            </div>
            <p className="report-summary-text">{report.summary || 'Interview completed.'}</p>
            <div className="report-meta">
              <span className="badge badge-muted">{data.role}</span>
              <span className={`badge badge-${data.difficulty === 'Easy' ? 'success' : data.difficulty === 'Hard' ? 'danger' : 'warning'}`}>
                {data.difficulty}
              </span>
              {data.duration_minutes && (
                <span className="badge badge-muted">{data.duration_minutes} min</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="report-grid">
        {/* Skill radar */}
        {radarData.length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 20 }}>Skill Breakdown</h4>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Radar name="Score" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Q scores bar chart */}
        {questionScores.length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 20 }}>Question Scores</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={questionScores} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
                  cursor={{ fill: 'rgba(108,99,255,0.08)' }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {questionScores.map((e, i) => (
                    <Cell key={i} fill={e.score >= 70 ? '#22c55e' : e.score >= 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Strengths */}
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>
            <CheckCircle2 size={16} color="var(--success)" style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Key Strengths
          </h4>
          {(report.strengths || []).length > 0 ? (
            <div className="report-list">
              {report.strengths.map((s, i) => (
                <div key={i} className="report-list-item report-list-success">
                  <span className="report-list-dot success" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted">No specific strengths noted.</p>}
        </div>

        {/* Improvements */}
        <div className="card">
          <h4 style={{ marginBottom: 16 }}>
            <AlertCircle size={16} color="var(--warning)" style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Areas for Improvement
          </h4>
          {(report.areas_for_improvement || []).length > 0 ? (
            <div className="report-list">
              {report.areas_for_improvement.map((s, i) => (
                <div key={i} className="report-list-item report-list-warning">
                  <span className="report-list-dot warning" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-muted">No specific improvements noted.</p>}
        </div>

        {/* Next steps */}
        {(report.next_steps || []).length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h4 style={{ marginBottom: 16 }}>
              <Star size={16} color="var(--accent)" style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Recommended Next Steps
            </h4>
            <div className="next-steps-grid">
              {report.next_steps.map((s, i) => (
                <div key={i} className="next-step-item">
                  <div className="next-step-num">{String(i + 1).padStart(2, '0')}</div>
                  <div>{s}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Q&A Review */}
      {(data.questions || []).length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h4 style={{ marginBottom: 20 }}>Question & Answer Review</h4>
          <div className="qa-list">
            {data.questions.map((q, i) => {
              const fb = q.feedback || {}
              const scorePct = Math.round((q.score / 10) * 100)
              return (
                <div key={q.id} className="qa-item">
                  <div className="qa-header">
                    <span className="badge badge-accent">Q{i + 1}</span>
                    <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{q.question_type}</span>
                    <span className="badge badge-muted">{q.topic}</span>
                    <span className={`badge badge-${scorePct >= 70 ? 'success' : scorePct >= 50 ? 'warning' : 'danger'}`}>
                      {q.score}/10
                    </span>
                  </div>
                  <div className="qa-question">{q.question_text}</div>
                  <div className="qa-answer">{q.answer_text || <em style={{ color: 'var(--text-muted)' }}>No answer provided</em>}</div>
                  {fb.feedback && <div className="qa-feedback">{fb.feedback}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
