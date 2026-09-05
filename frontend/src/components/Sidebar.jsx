import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Play, BarChart2, BookOpen, History,
  User, Settings, LogOut, Cpu, Sparkles, Database
} from 'lucide-react'
import './Sidebar.css'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/preview', icon: Sparkles, label: 'RAG Preview', badge: 'AI' },
  { to: '/interview/start', icon: Play, label: 'Start Interview' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/questions', icon: BookOpen, label: 'Question Bank' },
  { to: '/history', icon: History, label: 'History' },
]

const bottomItems = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Cpu size={20} color="#6c63ff" />
        </div>
        <div>
          <div className="sidebar-logo-name">InterviewAI</div>
          <div className="sidebar-logo-sub">Powered by Granite</div>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Main nav */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">WORKSPACE</div>
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Icon size={17} />
            <span>{label}</span>
            {badge && <span className="sidebar-item-badge">{badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-divider" />

      {/* Bottom nav */}
      <nav className="sidebar-nav">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || 'User'}</div>
          <div className="sidebar-user-role">{user?.role || 'Candidate'}</div>
        </div>
        <button onClick={handleLogout} className="sidebar-logout" title="Logout">
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  )
}
