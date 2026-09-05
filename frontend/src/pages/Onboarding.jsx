import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { User, FileText, Briefcase, ChevronRight, Cpu, CheckCircle2, Upload, Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import './Onboarding.css'

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer',
  'Full Stack Developer', 'Data Scientist', 'ML Engineer',
  'DevOps Engineer', 'Cloud Architect', 'Product Manager', 'Mobile Developer',
]
const EXPERIENCE_LEVELS = ['Entry-level (0-2 yrs)', 'Mid-level (3-5 yrs)', 'Senior (6-10 yrs)', 'Lead/Principal (10+ yrs)']

export default function Onboarding() {
  const { user, updateUser } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [resumeAnalysis, setResumeAnalysis] = useState(null)

  const [profile, setProfile] = useState({
    name: user?.name || '',
    role: user?.role || 'Software Engineer',
    experience: user?.experience || 'Mid-level',
  })
  const [resumeText, setResumeText] = useState(user?.resume_text || '')

  // Step 1: Save profile
  const handleProfileSave = async () => {
    if (!profile.name.trim()) return toast.error('Name is required')
    setLoading(true)
    try {
      const exp = profile.experience.split(' ')[0]
      const r = await api.put('/auth/profile', { ...profile, experience: exp })
      updateUser(r.data.user)
      setStep(2)
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Upload & analyze resume
  const handleResumeUpload = async () => {
    if (!resumeText.trim()) {
      // Skip resume — go straight to preview
      setStep(3)
      return
    }
    setAnalyzing(true)
    try {
      const r = await api.post('/profile/upload-resume', { resume_text: resumeText })
      updateUser(r.data.user)
      setResumeAnalysis({
        skills: r.data.inferred_skills,
        matched: r.data.matched_question_count,
      })
      toast.success(`Resume analyzed! Found ${r.data.inferred_skills.length} skill areas.`)
      setStep(3)
    } catch {
      toast.error('Resume analysis failed — continuing without it')
      setStep(3)
    } finally {
      setAnalyzing(false)
    }
  }

  // Step 3: Finish
  const handleFinish = () => {
    toast.success('Profile complete! Ready to start practicing.')
    nav('/interview/start')
  }

  const steps = [
    { n: 1, label: 'Your Profile' },
    { n: 2, label: 'Resume / Skills' },
    { n: 3, label: 'Ready to Go' },
  ]

  return (
    <div className="onboarding-page">
      {/* Left branding */}
      <div className="onboarding-left">
        <div className="onboarding-brand">
          <div className="onboarding-brand-icon"><Cpu size={28} color="#6c63ff" /></div>
          <span>InterviewAI</span>
        </div>
        <div className="onboarding-left-content">
          <h1>Let's set up your profile</h1>
          <p>A personalized profile helps our RAG engine retrieve the most relevant questions and industry insights for your target role.</p>
          <div className="onboarding-features">
            {[
              'Role-specific question generation',
              'Resume-based personalization',
              'Industry expectations & tips',
              'Tailored improvement strategies',
            ].map(f => (
              <div key={f} className="onboarding-feature">
                <CheckCircle2 size={15} color="var(--accent)" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="onboarding-glow" />
      </div>

      {/* Right form */}
      <div className="onboarding-right">
        {/* Step indicators */}
        <div className="onboarding-steps">
          {steps.map(s => (
            <div key={s.n} className={`onboarding-step${step === s.n ? ' active' : step > s.n ? ' done' : ''}`}>
              <div className="onboarding-step-circle">
                {step > s.n ? <CheckCircle2 size={14} /> : s.n}
              </div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="onboarding-form-area fade-in" key={step}>
          {/* Step 1: Profile */}
          {step === 1 && (
            <div>
              <div className="onboarding-form-header">
                <User size={22} color="var(--accent)" />
                <div>
                  <h2>Your Profile</h2>
                  <p>Tell us about yourself and your career goals</p>
                </div>
              </div>

              <div className="onboarding-form">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input className="input" value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Priya Sharma" />
                </div>

                <div className="input-group">
                  <label className="input-label">Target Role</label>
                  <div className="role-select-grid">
                    {ROLES.map(r => (
                      <button key={r}
                        className={`role-chip${profile.role === r ? ' selected' : ''}`}
                        onClick={() => setProfile(p => ({ ...p, role: r }))}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Experience Level</label>
                  <div className="exp-grid">
                    {EXPERIENCE_LEVELS.map(l => (
                      <button key={l}
                        className={`exp-option${profile.experience === l.split(' ')[0] || profile.experience.startsWith(l.split(' ')[0]) ? ' selected' : ''}`}
                        onClick={() => setProfile(p => ({ ...p, experience: l.split(' ')[0] }))}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary btn-lg w-full" onClick={handleProfileSave} disabled={loading}>
                  {loading ? <Loader2 size={16} className="spin-icon" /> : <>Continue <ChevronRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Resume */}
          {step === 2 && (
            <div>
              <div className="onboarding-form-header">
                <FileText size={22} color="var(--accent)" />
                <div>
                  <h2>Your Resume</h2>
                  <p>Paste your resume text for personalized question generation <span className="badge badge-accent" style={{marginLeft:6}}>Optional</span></p>
                </div>
              </div>

              <div className="resume-drop-area">
                <div className="resume-drop-icon">
                  <Upload size={24} color="var(--accent)" />
                </div>
                <p className="resume-drop-title">Paste your resume text below</p>
                <p className="resume-drop-sub">Our RAG engine will extract your skills and tailor interview questions to your background</p>
              </div>

              <textarea
                className="input"
                style={{ minHeight: 200, marginTop: 16, fontSize: 13, lineHeight: 1.6 }}
                placeholder="Paste your resume here... (work experience, skills, education, projects)

Example:
Software Engineer at Acme Corp (2022-2024)
- Built React frontend with TypeScript
- Designed REST APIs with Node.js and PostgreSQL
- Experience with Docker, Kubernetes, AWS EC2
- Led migration from monolith to microservices..."
                value={resumeText}
                onChange={e => setResumeText(e.target.value)}
              />

              {resumeText.length > 0 && (
                <div className="resume-char-count">{resumeText.length} characters · {Math.round(resumeText.split(' ').length)} words</div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="btn btn-ghost" onClick={() => setStep(3)}>
                  Skip for now
                </button>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleResumeUpload} disabled={analyzing}>
                  {analyzing
                    ? <><Loader2 size={16} className="spin-icon" /> Analyzing with Granite AI...</>
                    : <><Sparkles size={16} /> Analyze &amp; Continue</>}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="onboarding-ready">
              <div className="onboarding-ready-icon">
                <CheckCircle2 size={40} color="var(--success)" />
              </div>
              <h2>You're all set!</h2>
              <p>Your profile is configured. IBM Granite AI will now generate personalized questions based on your background.</p>

              {resumeAnalysis && (
                <div className="onboarding-analysis-card">
                  <div className="onboarding-analysis-header">
                    <Sparkles size={14} color="var(--accent)" />
                    <span>Resume Analysis Complete</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                    Found <strong>{resumeAnalysis.matched}</strong> matching interview questions for your profile
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {resumeAnalysis.skills.map(s => (
                      <span key={s} className="badge badge-accent">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="onboarding-profile-summary">
                <div className="onboarding-summary-row">
                  <span className="text-muted">Name</span>
                  <span className="font-semibold">{user?.name}</span>
                </div>
                <div className="onboarding-summary-row">
                  <span className="text-muted">Target Role</span>
                  <span className="font-semibold">{user?.role}</span>
                </div>
                <div className="onboarding-summary-row">
                  <span className="text-muted">Experience</span>
                  <span className="font-semibold">{user?.experience}</span>
                </div>
                <div className="onboarding-summary-row">
                  <span className="text-muted">Resume</span>
                  <span className={`badge badge-${user?.resume_text ? 'success' : 'muted'}`}>
                    {user?.resume_text ? 'Uploaded' : 'Not provided'}
                  </span>
                </div>
              </div>

              <button className="btn btn-primary btn-lg w-full" onClick={handleFinish}>
                <Cpu size={16} /> Start Practicing with AI
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
