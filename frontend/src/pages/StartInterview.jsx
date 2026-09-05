import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import { Play, ChevronRight, Briefcase, Target, BookOpen, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import './StartInterview.css'

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Cloud Architect',
  'Product Manager', 'Mobile Developer', 'QA Engineer', 'Security Engineer',
]

const DIFFICULTIES = [
  { value: 'Easy', desc: 'Foundational concepts, beginner-friendly' },
  { value: 'Medium', desc: 'Intermediate problems, common in FAANG' },
  { value: 'Hard', desc: 'Advanced topics, senior-level questions' },
]

const TOPIC_GROUPS = {
  'Technical': ['Data Structures', 'Algorithms', 'System Design', 'Databases', 'Networking', 'OOP', 'Design Patterns'],
  'Domain': ['Frontend', 'Backend', 'Cloud & DevOps', 'Machine Learning', 'Security', 'Mobile'],
  'Behavioral': ['Leadership', 'Problem Solving', 'Communication', 'Teamwork', 'Adaptability'],
}

export default function StartInterview() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    role: 'Software Engineer',
    difficulty: 'Medium',
    topics: ['Data Structures', 'Algorithms'],
  })
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  const toggleTopic = t => {
    setForm(p => ({
      ...p,
      topics: p.topics.includes(t)
        ? p.topics.filter(x => x !== t)
        : [...p.topics, t].slice(0, 5),
    }))
  }

  const handleStart = async () => {
    if (!form.topics.length) return toast.error('Select at least one topic')
    setLoading(true)
    try {
      const r = await api.post('/interviews/start', form)
      nav(`/interview/${r.data.interview.session_id}`)
    } catch {
      toast.error('Failed to start interview')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <h2>Start Interview</h2>
        <p>Configure your practice session with IBM Granite AI</p>
      </div>

      {/* Step indicator */}
      <div className="start-steps">
        {[{n:1,label:'Choose Role'},{n:2,label:'Difficulty'},{n:3,label:'Topics'}].map(s => (
          <div key={s.n} className={`start-step${step === s.n ? ' active' : step > s.n ? ' done' : ''}`}>
            <div className="start-step-circle">{step > s.n ? '✓' : s.n}</div>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="start-container">
        {/* Step 1: Role */}
        {step === 1 && (
          <div className="fade-in">
            <div className="start-section-header">
              <Briefcase size={18} color="var(--accent)" />
              <div>
                <h3>Select your target role</h3>
                <p>Questions will be tailored to this position</p>
              </div>
            </div>
            <div className="role-grid">
              {ROLES.map(r => (
                <button key={r}
                  className={`role-option${form.role === r ? ' selected' : ''}`}
                  onClick={() => setForm(p => ({ ...p, role: r }))}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Difficulty */}
        {step === 2 && (
          <div className="fade-in">
            <div className="start-section-header">
              <Target size={18} color="var(--accent)" />
              <div>
                <h3>Choose difficulty level</h3>
                <p>Match to your experience and target company</p>
              </div>
            </div>
            <div className="difficulty-grid">
              {DIFFICULTIES.map(({ value, desc }) => (
                <button key={value}
                  className={`difficulty-option${form.difficulty === value ? ' selected' : ''}`}
                  onClick={() => setForm(p => ({ ...p, difficulty: value }))}>
                  <div className={`difficulty-dot difficulty-${value.toLowerCase()}`} />
                  <div>
                    <div className="difficulty-name">{value}</div>
                    <div className="difficulty-desc">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Topics */}
        {step === 3 && (
          <div className="fade-in">
            <div className="start-section-header">
              <BookOpen size={18} color="var(--accent)" />
              <div>
                <h3>Select topics (up to 5)</h3>
                <p>Focus areas for your interview</p>
              </div>
            </div>
            {Object.entries(TOPIC_GROUPS).map(([group, topics]) => (
              <div key={group} className="topic-group">
                <div className="topic-group-label">{group}</div>
                <div className="topic-tags">
                  {topics.map(t => (
                    <button key={t}
                      className={`topic-tag${form.topics.includes(t) ? ' selected' : ''}`}
                      onClick={() => toggleTopic(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {form.topics.length > 0 && (
              <div className="selected-topics-preview">
                <span style={{fontSize: 12, color: 'var(--text-muted)'}}>Selected:</span>
                {form.topics.map(t => <span key={t} className="badge badge-accent">{t}</span>)}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="start-nav">
          {step > 1 && (
            <button className="btn btn-secondary" onClick={() => setStep(p => p - 1)}>
              Back
            </button>
          )}
          <div style={{flex: 1}} />
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep(p => p + 1)}>
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={handleStart} disabled={loading}>
              {loading ? <><Loader2 size={16} className="spin-icon" /> Starting...</> : <><Play size={16} /> Launch Interview</>}
            </button>
          )}
        </div>

        {/* Summary (step 3) */}
        {step === 3 && (
          <div className="start-summary fade-in">
            <div className="start-summary-item">
              <span className="text-muted">Role</span>
              <span className="font-medium">{form.role}</span>
            </div>
            <div className="start-summary-item">
              <span className="text-muted">Difficulty</span>
              <span className={`badge badge-${form.difficulty === 'Easy' ? 'success' : form.difficulty === 'Hard' ? 'danger' : 'warning'}`}>
                {form.difficulty}
              </span>
            </div>
            <div className="start-summary-item">
              <span className="text-muted">Topics</span>
              <span className="font-medium">{form.topics.length} selected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
