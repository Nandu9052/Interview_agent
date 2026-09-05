import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Cpu, Eye, EyeOff, Mail, Lock, User, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import './Auth.css'

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      nav('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon"><Cpu size={24} color="#6c63ff" /></div>
            <span>InterviewAI</span>
          </div>
          <h1>Welcome back</h1>
          <p>Sign in to continue your interview preparation journey</p>
          <div className="auth-features">
            {['AI-powered question generation', 'Instant detailed feedback', 'Performance tracking', 'IBM Granite 4 model'].map(f => (
              <div key={f} className="auth-feature-item">
                <span className="auth-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-left-glow" />
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Sign in</h2>
            <p>Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Email address</label>
              <div className="input-with-icon">
                <Mail size={15} className="input-icon" />
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <Lock size={15} className="input-icon" />
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button type="button" className="input-icon-right" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>

          <div className="auth-divider"><span>New to InterviewAI?</span></div>
          <Link to="/register" className="btn btn-secondary w-full">Create an account</Link>
        </div>
      </div>
    </div>
  )
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'Software Engineer', experience: 'Mid-level' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const nav = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form)
      nav('/onboarding')
      toast.success('Welcome to InterviewAI! Let\'s set up your profile.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">
            <div className="auth-brand-icon"><Cpu size={24} color="#6c63ff" /></div>
            <span>InterviewAI</span>
          </div>
          <h1>Start your journey</h1>
          <p>Create your account and start practicing with AI today</p>
          <div className="auth-features">
            {['Personalized question generation', 'Role-specific training', 'Detailed performance reports', 'Progress tracking over time'].map(f => (
              <div key={f} className="auth-feature-item">
                <span className="auth-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-left-glow" />
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Create account</h2>
            <p>Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label className="input-label">Full name</label>
              <div className="input-with-icon">
                <User size={15} className="input-icon" />
                <input className="input" type="text" placeholder="John Doe" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required style={{ paddingLeft: '38px' }} />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Email address</label>
              <div className="input-with-icon">
                <Mail size={15} className="input-icon" />
                <input className="input" type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required style={{ paddingLeft: '38px' }} />
              </div>
            </div>

            <div className="auth-form-row">
              <div className="input-group">
                <label className="input-label">Target Role</label>
                <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
                    'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Product Manager'].map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Experience</label>
                <select className="input" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}>
                  {['Entry-level', 'Mid-level', 'Senior', 'Lead', 'Principal'].map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-with-icon">
                <Lock size={15} className="input-icon" />
                <input className="input" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required
                  style={{ paddingLeft: '38px', paddingRight: '40px' }} />
                <button type="button" className="input-icon-right" onClick={() => setShowPw(p => !p)}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <div className="auth-divider"><span>Already have an account?</span></div>
          <Link to="/login" className="btn btn-secondary w-full">Sign in instead</Link>
        </div>
      </div>
    </div>
  )
}
