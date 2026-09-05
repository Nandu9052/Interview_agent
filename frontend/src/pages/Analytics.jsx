import { useState, useEffect } from 'react'
import api from '../api'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { TrendingUp, Award, BarChart2, Target } from 'lucide-react'
import './Analytics.css'

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--accent)' }}>
          {p.name}: <strong>{p.value}{typeof p.value === 'number' && p.value <= 100 ? '%' : ''}</strong>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <span className="spinner spinner-lg" />
    </div>
  )

  if (!data || data.total_interviews === 0) return (
    <div className="page-content">
      <div className="page-header"><h2>Performance Analytics</h2><p>Track your interview progress over time</p></div>
      <div className="empty-state" style={{ marginTop: 60 }}>
        <div className="empty-state-icon"><BarChart2 size={28} color="var(--text-muted)" /></div>
        <h3>No data yet</h3>
        <p>Complete your first interview to see detailed analytics and performance trends</p>
        <a href="/interview/start" className="btn btn-primary" style={{ marginTop: 12 }}>Start Interview</a>
      </div>
    </div>
  )

  const trendData = data.improvement_trend || []
  const diffData = Object.entries(data.score_by_difficulty || {}).map(([k, v]) => ({ name: k, score: v }))
  const gradeData = Object.entries(data.grade_distribution || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v }))

  const GRADE_COLORS = { A: '#22c55e', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2>Performance Analytics</h2>
        <p>Insights from your {data.total_interviews} completed interview{data.total_interviews !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-subtle)' }}><BarChart2 size={20} color="var(--accent)" /></div>
          <div><div className="stat-value">{data.total_interviews}</div><div className="stat-label">Interviews</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-subtle)' }}><TrendingUp size={20} color="var(--success)" /></div>
          <div><div className="stat-value">{data.average_score}%</div><div className="stat-label">Avg Score</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-subtle)' }}><Award size={20} color="var(--warning)" /></div>
          <div><div className="stat-value">{data.best_score}%</div><div className="stat-label">Best Score</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-subtle)' }}><Target size={20} color="var(--info)" /></div>
          <div>
            <div className="stat-value">{data.average_score >= 80 ? 'A' : data.average_score >= 70 ? 'B' : data.average_score >= 60 ? 'C' : 'D'}</div>
            <div className="stat-label">Avg Grade</div>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Score trend */}
        {trendData.length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h4 style={{ marginBottom: 20 }}>Score Trend Over Time</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} />
                <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={2.5}
                  dot={{ fill: 'var(--accent)', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'var(--accent)', strokeWidth: 2, stroke: '#fff' }} name="Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Score by difficulty */}
        {diffData.length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 20 }}>Average Score by Difficulty</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={diffData} barSize={36}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} cursor={{ fill: 'rgba(108,99,255,0.06)' }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} name="Score">
                  {diffData.map((e, i) => (
                    <Cell key={i} fill={e.name === 'Easy' ? '#22c55e' : e.name === 'Hard' ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Grade distribution */}
        {gradeData.length > 0 && (
          <div className="card">
            <h4 style={{ marginBottom: 20 }}>Grade Distribution</h4>
            <div className="grade-dist">
              {gradeData.map(({ name, value }) => (
                <div key={name} className="grade-dist-row">
                  <div className="grade-dist-label" style={{ color: GRADE_COLORS[name] }}>{name}</div>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{
                      width: `${(value / data.total_interviews) * 100}%`,
                      background: GRADE_COLORS[name]
                    }} />
                  </div>
                  <div className="grade-dist-count">{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
