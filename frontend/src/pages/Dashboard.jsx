import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import {
  Play, TrendingUp, Award, Clock, ChevronRight, BarChart2,
  CheckCircle2, AlertCircle, Zap, Calendar
} from 'lucide-react'
import './Dashboard.css'

function ScoreBadge({ score }) {
  const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'
  return <span className={`badge badge-${color}`}>{score}%</span>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState(null)
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/analytics'), api.get('/interviews')])
      .then(([a, i]) => {
        setAnalytics(a.data)
        setInterviews(i.data.interviews.slice(0, 5))
      })
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="page-content">
      <div className="dashboard-skeleton">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{height: 88, borderRadius: 14}} />)}
      </div>
    </div>
  )

  return (
    <div className="page-content fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <p className="dashboard-greeting">{greeting}, {user?.name?.split(' ')[0]} 👋</p>
          <h2>Your Interview Dashboard</h2>
          <p className="text-muted" style={{marginTop: 4}}>Track your preparation progress and jump into practice</p>
        </div>
        <Link to="/interview/start" className="btn btn-primary btn-lg">
          <Play size={16} /> Start Interview
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{marginBottom: 28}}>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'var(--accent-subtle)'}}>
            <BarChart2 size={20} color="var(--accent)" />
          </div>
          <div>
            <div className="stat-value">{analytics?.total_interviews || 0}</div>
            <div className="stat-label">Total Interviews</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'var(--success-subtle)'}}>
            <TrendingUp size={20} color="var(--success)" />
          </div>
          <div>
            <div className="stat-value">{analytics?.average_score || 0}%</div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'var(--warning-subtle)'}}>
            <Award size={20} color="var(--warning)" />
          </div>
          <div>
            <div className="stat-value">{analytics?.best_score || 0}%</div>
            <div className="stat-label">Best Score</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'var(--info-subtle)'}}>
            <Zap size={20} color="var(--info)" />
          </div>
          <div>
            <div className="stat-value">{user?.experience || '—'}</div>
            <div className="stat-label">Experience Level</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Quick Actions */}
        <div className="dashboard-left">
          <div className="card">
            <h4 style={{marginBottom: 16}}>Quick Actions</h4>
            <div className="quick-actions">
              {[
                { to: '/interview/start', icon: Play, label: 'New Interview', sub: 'Start a practice session', color: 'var(--accent)' },
                { to: '/analytics', icon: TrendingUp, label: 'View Analytics', sub: 'See your progress', color: 'var(--success)' },
                { to: '/questions', icon: BarChart2, label: 'Question Bank', sub: 'Browse all questions', color: 'var(--warning)' },
                { to: '/history', icon: Clock, label: 'Past Interviews', sub: 'Review your history', color: 'var(--info)' },
              ].map(({ to, icon: Icon, label, sub, color }) => (
                <Link key={to} to={to} className="quick-action-item">
                  <div className="quick-action-icon" style={{background: `${color}20`}}>
                    <Icon size={17} color={color} />
                  </div>
                  <div>
                    <div className="quick-action-label">{label}</div>
                    <div className="quick-action-sub">{sub}</div>
                  </div>
                  <ChevronRight size={15} color="var(--text-muted)" style={{marginLeft: 'auto'}} />
                </Link>
              ))}
            </div>
          </div>

          {/* Role info */}
          <div className="card dashboard-role-card">
            <div className="dashboard-role-header">
              <div>
                <div style={{fontSize: 12, color: 'var(--text-muted)', marginBottom: 4}}>CURRENT TARGET ROLE</div>
                <div style={{fontWeight: 600, fontSize: 15}}>{user?.role || 'Not set'}</div>
              </div>
              <Link to="/profile" className="btn btn-ghost btn-sm">Edit</Link>
            </div>
            <div className="divider" />
            <div style={{display:'flex', gap: 24}}>
              <div>
                <div style={{fontSize: 11, color: 'var(--text-muted)'}}>EXPERIENCE</div>
                <div style={{fontWeight: 500, marginTop: 2}}>{user?.experience || '—'}</div>
              </div>
              <div>
                <div style={{fontSize: 11, color: 'var(--text-muted)'}}>INTERVIEWS</div>
                <div style={{fontWeight: 500, marginTop: 2}}>{analytics?.total_interviews || 0}</div>
              </div>
              <div>
                <div style={{fontSize: 11, color: 'var(--text-muted)'}}>AVG SCORE</div>
                <div style={{fontWeight: 500, marginTop: 2}}>{analytics?.average_score || 0}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Interviews */}
        <div className="dashboard-right">
          <div className="card" style={{height: '100%'}}>
            <div className="flex justify-between items-center" style={{marginBottom: 16}}>
              <h4>Recent Interviews</h4>
              <Link to="/history" className="btn btn-ghost btn-sm">View all</Link>
            </div>
            {interviews.length === 0 ? (
              <div className="empty-state" style={{padding: '40px 16px'}}>
                <div className="empty-state-icon">
                  <Calendar size={28} color="var(--text-muted)" />
                </div>
                <h3>No interviews yet</h3>
                <p>Start your first AI interview session to see your results here</p>
                <Link to="/interview/start" className="btn btn-primary" style={{marginTop: 8}}>
                  Start Now
                </Link>
              </div>
            ) : (
              <div className="interview-list">
                {interviews.map(iv => (
                  <Link key={iv.id} to={`/interview/${iv.session_id}/report`} className="interview-item">
                    <div className="interview-item-left">
                      <div className="interview-item-role">{iv.role}</div>
                      <div className="interview-item-meta">
                        <span className={`badge badge-${iv.difficulty === 'Easy' ? 'success' : iv.difficulty === 'Hard' ? 'danger' : 'warning'}`}>
                          {iv.difficulty}
                        </span>
                        <span className="text-muted" style={{fontSize: 12}}>
                          {new Date(iv.started_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="interview-item-right">
                      {iv.status === 'completed' ? (
                        <ScoreBadge score={iv.overall_score} />
                      ) : (
                        <span className="badge badge-accent">Active</span>
                      )}
                      <ChevronRight size={14} color="var(--text-muted)" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
