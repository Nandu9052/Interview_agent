import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { Save, Sparkles, FileText, Loader2, CheckCircle2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', role: user?.role || '', experience: user?.experience || '' })
  const [resumeText, setResumeText] = useState(user?.resume_text || '')
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleSave = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const r = await api.put('/auth/profile', form)
      updateUser(r.data.user)
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleResumeAnalyze = async () => {
    if (!resumeText.trim()) return toast.error('Enter your resume text first')
    setAnalyzing(true)
    try {
      const r = await api.post('/profile/upload-resume', { resume_text: resumeText })
      updateUser(r.data.user)
      setAnalysisResult(r.data)
      toast.success(`Resume analyzed! Found ${r.data.inferred_skills.length} skill areas.`)
    } catch {
      toast.error('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header"><h2>Profile</h2><p>Manage your information and improve AI personalization</p></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        {/* Left: personal info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Avatar card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--accent-subtle)', border: '2px solid rgba(108,99,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'var(--accent)', flexShrink: 0,
              }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>{user?.email}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge badge-accent">{user?.role}</span>
                  <span className="badge badge-muted">{user?.experience}</span>
                  {user?.resume_text && <span className="badge badge-success"><CheckCircle2 size={10} /> Resume</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="card">
            <h4 style={{ marginBottom: 20 }}>Edit Profile</h4>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="input-group">
                <label className="input-label">Target Role</label>
                <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
                    'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'Cloud Architect', 'Product Manager'].map(r => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Experience Level</label>
                <select className="input" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}>
                  {['Entry-level', 'Mid-level', 'Senior', 'Lead', 'Principal'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : <><Save size={14} /> Save Changes</>}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Resume */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color="var(--accent)" />
                <h4>Resume / Skills</h4>
              </div>
              <span className="badge badge-accent" style={{ gap: 4 }}><Sparkles size={10} /> RAG Powered</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.55 }}>
              Paste your resume text to personalize AI question generation. The RAG engine will match your background to relevant interview topics.
            </p>
            <textarea
              className="input"
              style={{ minHeight: 180, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}
              placeholder="Paste your resume here (work experience, skills, projects, education)..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
            />
            <button className="btn btn-primary w-full" onClick={handleResumeAnalyze} disabled={analyzing}>
              {analyzing
                ? <><Loader2 size={14} style={{ animation: 'spin-anim 0.8s linear infinite' }} /> Analyzing...</>
                : <><Sparkles size={14} /> Analyze Resume with Granite AI</>}
            </button>
          </div>

          {/* Analysis result */}
          {(analysisResult || user?.skills?.length > 0) && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle2 size={15} color="var(--success)" />
                <h4 style={{ color: 'var(--success)' }}>Analysis Complete</h4>
              </div>
              {analysisResult && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                  Matched <strong>{analysisResult.matched_question_count}</strong> relevant questions in our knowledge base
                </p>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {(analysisResult?.inferred_skills || user?.skills || []).map(s => (
                  <span key={s} className="badge badge-accent">{s}</span>
                ))}
              </div>
              <Link to="/preview" className="btn btn-secondary w-full btn-sm">
                View Personalized Questions <ChevronRight size={13} />
              </Link>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin-anim { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
