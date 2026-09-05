import { useState } from 'react'
import { Bell, Moon, Shield, Cpu, Save } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    autoSave: true,
    questionCount: 5,
    timerEnabled: true,
  })

  const toggle = key => setSettings(p => ({ ...p, [key]: !p[key] }))

  const handleSave = () => toast.success('Settings saved')

  const Toggle = ({ value, onChange }) => (
    <button
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? 'var(--accent)' : 'var(--bg-elevated)',
        border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`,
        cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0,
      }}>
      <span style={{
        position: 'absolute', top: 2, left: value ? 22 : 2,
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )

  const SettingRow = ({ label, desc, value, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  )

  return (
    <div className="page-content fade-in">
      <div className="page-header"><h2>Settings</h2><p>Customize your interview experience</p></div>

      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <Bell size={16} color="var(--accent)" />
            <h4>Preferences</h4>
          </div>
          <SettingRow label="Notifications" desc="Get alerts about new features and tips"
            value={settings.notifications} onChange={() => toggle('notifications')} />
          <SettingRow label="Dark Mode" desc="Use dark theme (recommended)"
            value={settings.darkMode} onChange={() => toggle('darkMode')} />
          <SettingRow label="Auto-save answers" desc="Automatically save your answers as you type"
            value={settings.autoSave} onChange={() => toggle('autoSave')} />
          <SettingRow label="Show timer" desc="Display a timer during your interview session"
            value={settings.timerEnabled} onChange={() => toggle('timerEnabled')} />
          <div style={{ paddingTop: 4, borderBottom: 'none' }}>
            <div className="input-group">
              <label className="input-label">Questions per session</label>
              <select className="input" value={settings.questionCount}
                onChange={e => setSettings(p => ({ ...p, questionCount: Number(e.target.value) }))}>
                {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n} questions</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
            <Cpu size={16} color="var(--accent)" />
            <h4>AI Model Info</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            {[
              ['Model', 'IBM Granite 4 Heat Small'],
              ['Platform', 'watsonx.ai (us-south)'],
              ['Generation', 'Text Generation v1'],
              ['Context Window', '4,096 tokens'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={14} /> Save Settings
        </button>
      </div>
    </div>
  )
}
