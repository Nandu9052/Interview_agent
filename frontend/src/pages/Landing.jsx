import { Link } from 'react-router-dom'
import { Cpu, Zap, BarChart2, Shield, ArrowRight, CheckCircle2, Brain, Target, TrendingUp } from 'lucide-react'
import './Landing.css'

const features = [
  { icon: Brain, title: 'AI-Powered Questions', desc: 'IBM Granite 4 generates contextual, role-specific interview questions tailored to your experience level.' },
  { icon: Target, title: 'Real-time Feedback', desc: 'Receive instant, detailed feedback on every answer with scoring, strengths, and improvement areas.' },
  { icon: TrendingUp, title: 'Performance Analytics', desc: 'Track your progress over time with detailed analytics, charts, and trend analysis.' },
  { icon: Shield, title: 'Role-specific Training', desc: 'Customize interviews by role, seniority, and topic focus. Practice exactly what you need.' },
]

const roles = ['Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer', 'ML Engineer', 'Full Stack Developer']

const stats = [
  { value: '50+', label: 'Interview Roles' },
  { value: '1000+', label: 'Practice Questions' },
  { value: '95%', label: 'User Satisfaction' },
  { value: 'IBM', label: 'Granite AI Model' },
]

export default function Landing() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon"><Cpu size={18} /></div>
            <span>InterviewAI</span>
          </div>
          <div className="landing-header-actions">
            <Link to="/login" className="btn btn-ghost">Sign in</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <Zap size={12} />
          <span>Powered by IBM Granite 4 · watsonx.ai</span>
        </div>
        <h1 className="landing-hero-title">
          Ace Your Next<br />
          <span className="landing-hero-highlight">Technical Interview</span>
        </h1>
        <p className="landing-hero-sub">
          Practice with an AI interviewer trained on thousands of real interview questions.
          Get instant feedback, track progress, and land your dream job.
        </p>
        <div className="landing-hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Start Practicing Free <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
        <div className="landing-hero-roles">
          {roles.map(r => (
            <span key={r} className="landing-role-tag">{r}</span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="landing-stats">
        {stats.map(s => (
          <div key={s.label} className="landing-stat">
            <div className="landing-stat-value">{s.value}</div>
            <div className="landing-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-section-header">
          <h2>Everything you need to prepare</h2>
          <p>A complete interview preparation platform powered by IBM's latest AI models</p>
        </div>
        <div className="landing-features-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-feature-card">
              <div className="landing-feature-icon">
                <Icon size={20} color="var(--accent)" />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-steps">
        <div className="landing-section-header">
          <h2>How it works</h2>
          <p>Get started in under 2 minutes</p>
        </div>
        <div className="landing-steps-grid">
          {[
            { n: '01', title: 'Create Account', desc: 'Sign up and set your target role and experience level.' },
            { n: '02', title: 'Start Interview', desc: 'Choose your interview type, difficulty, and topics.' },
            { n: '03', title: 'Get AI Feedback', desc: 'Receive detailed scoring and improvement suggestions.' },
            { n: '04', title: 'Track Progress', desc: 'Monitor your improvement with analytics over time.' },
          ].map(s => (
            <div key={s.n} className="landing-step">
              <div className="landing-step-number">{s.n}</div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="landing-cta-banner">
        <h2>Ready to start practicing?</h2>
        <p>Join thousands of engineers who improved their interview skills with InterviewAI</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create Free Account <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-icon"><Cpu size={16} /></div>
              <span>InterviewAI</span>
            </div>
            <p>Built with IBM watsonx.ai &amp; Granite 4</p>
          </div>
          <div className="landing-footer-links">
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
