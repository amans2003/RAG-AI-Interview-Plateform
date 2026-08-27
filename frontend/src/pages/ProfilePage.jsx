/**
 * Profile Page — user account info and stats with Lucide icons.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Calendar,
  FileText,
  Briefcase,
  Target,
  Award,
  LogOut,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { authService } from '../services/authService'
import { useAuth } from '../hooks/useAuth'
import { Loader, ErrorMessage } from '../components/common/index'
import { formatDate, getInitials } from '../utils/formatters'
import { ROUTES } from '../utils/constants'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authService.getStats()
        setStats(data)
      } catch {
        setError('Failed to load user stats')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <DashboardLayout title="Profile">
      <div className="page-content fade-in" style={{ maxWidth: 720 }}>
        <div className="page-header">
          <h2 className="page-title">Profile</h2>
          <p className="page-subtitle">Your account information and overall platform statistics</p>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* User Card */}
        <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)' }}>
          <div className="flex gap-5" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 4px 16px rgba(108, 99, 255, 0.4)',
              }}
            >
              {getInitials(user?.name || 'U')}
            </div>
            <div>
              <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, marginBottom: 4 }}>
                {user?.name}
              </h3>
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Mail size={13} /> {user?.email}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Calendar size={13} /> Member since {formatDate(user?.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <Loader text="Loading stats..." />
        ) : (
          stats && (
            <div className="grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {[
                {
                  label: 'Resumes Uploaded',
                  value: stats.resumes_count,
                  icon: FileText,
                  color: '#6c63ff',
                  bg: 'rgba(108, 99, 255, 0.12)',
                },
                {
                  label: 'Jobs Added',
                  value: stats.jobs_count,
                  icon: Briefcase,
                  color: '#00d4aa',
                  bg: 'rgba(0, 212, 170, 0.12)',
                },
                {
                  label: 'Analyses Completed',
                  value: stats.analyses_count,
                  icon: Target,
                  color: '#ffd166',
                  bg: 'rgba(255, 209, 102, 0.12)',
                },
                {
                  label: 'Avg Match Score',
                  value: `${stats.avg_match_score}%`,
                  icon: Award,
                  color: '#ff6b6b',
                  bg: 'rgba(255, 107, 107, 0.12)',
                },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="card" style={{ padding: 'var(--space-5)' }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 'var(--radius-md)',
                        background: s.bg,
                        color: s.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 'var(--space-3)',
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div
                      style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        color: 'var(--color-text-primary)',
                        lineHeight: 1,
                        marginBottom: 'var(--space-2)',
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      {s.label}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Actions */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Account Actions</h3>
          <button
            className="btn btn-danger"
            onClick={handleLogout}
            id="logout-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}
