/**
 * DashboardLayout — sidebar + main content area with topbar and Lucide icons.
 */
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Target,
  Mic,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getInitials } from '../utils/formatters'
import { ROUTES } from '../utils/constants'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', path: ROUTES.DASHBOARD },
  { icon: FileText, label: 'Resumes', path: ROUTES.RESUME },
  { icon: Briefcase, label: 'Jobs', path: ROUTES.JOBS },
  { icon: Target, label: 'Analysis', path: ROUTES.ANALYSIS },
  { icon: Mic, label: 'Interview Prep', path: ROUTES.INTERVIEW },
  { icon: MessageSquare, label: 'AI Chat', path: ROUTES.CHAT },
]

export default function DashboardLayout({ children, title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div
            className="flex gap-3"
            style={{ alignItems: 'center', cursor: 'pointer', flex: 1 }}
            onClick={() => {
              navigate(ROUTES.DASHBOARD)
              setSidebarOpen(false)
            }}
          >
            <div className="sidebar-logo-icon">
              <Sparkles size={20} />
            </div>
            <span className="sidebar-logo-text">ResumAI</span>
          </div>

          {/* Mobile Close Button */}
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to={ROUTES.PROFILE}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={18} className="nav-icon" />
            <span>Profile</span>
          </NavLink>
          <button
            className="nav-item"
            style={{ width: '100%', textAlign: 'left' }}
            onClick={handleLogout}
          >
            <LogOut size={18} className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-btn"
              aria-label="Open sidebar menu"
            >
              <Menu size={22} />
            </button>
            <h1 className="topbar-title">{title}</h1>
          </div>

          <div className="topbar-actions">
            <NavLink to={ROUTES.PROFILE}>
              <div
                className="user-avatar"
                title={user?.name}
                aria-label={`Profile: ${user?.name}`}
              >
                {getInitials(user?.name || 'U')}
              </div>
            </NavLink>
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
