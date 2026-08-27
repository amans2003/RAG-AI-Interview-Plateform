/**
 * Dashboard page — stats, recent analyses, skill overview with Lucide icons.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Briefcase,
  Target,
  Award,
  TrendingUp,
  Sparkles,
  MessageSquare,
  ArrowRight,
  UploadCloud,
  Plus,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { analysisService } from '../services/analysisService'
import { Loader, ErrorMessage, EmptyState } from '../components/common/index'
import { getScoreInfo } from '../utils/constants'
import { formatRelativeTime } from '../utils/formatters'
import { ROUTES } from '../utils/constants'

function StatCard({ icon: Icon, label, value, color, bg, onClick }) {
  return (
    <div
      className="stat-card"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: 'var(--space-5)',
      }}
    >
      <div
        className="stat-card-icon"
        style={{
          background: bg,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={22} />
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const data = await analysisService.getDashboardStats()
        setStats(data)
      } catch (err) {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <DashboardLayout title="Dashboard">
      <div className="page-content fade-in">
        <div className="page-header">
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Your career intelligence and AI match statistics at a glance</p>
        </div>

        {loading && <Loader text="Loading your dashboard..." />}
        {error && <ErrorMessage message={error} />}

        {stats && (
          <>
            {/* Stat Cards Grid */}
            <div className="grid-4" style={{ marginBottom: 'var(--space-8)' }}>
              <StatCard
                icon={FileText}
                label="Resumes Uploaded"
                value={stats.resumes_count}
                color="#6c63ff"
                bg="rgba(108, 99, 255, 0.12)"
                onClick={() => navigate(ROUTES.RESUME)}
              />
              <StatCard
                icon={Briefcase}
                label="Jobs Added"
                value={stats.jobs_count}
                color="#00d4aa"
                bg="rgba(0, 212, 170, 0.12)"
                onClick={() => navigate(ROUTES.JOBS)}
              />
              <StatCard
                icon={Target}
                label="Analyses Completed"
                value={stats.analyses_count}
                color="#ffd166"
                bg="rgba(255, 209, 102, 0.12)"
                onClick={() => navigate(ROUTES.ANALYSIS)}
              />
              <StatCard
                icon={Award}
                label="Avg Match Score"
                value={`${stats.avg_match_score}%`}
                color="#ff6b6b"
                bg="rgba(255, 107, 107, 0.12)"
              />
            </div>

            <div className="grid-2">
              {/* Recent Analyses */}
              <div className="card">
                <div className="section-header">
                  <h3
                    className="section-title"
                    style={{ fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <TrendingUp size={18} color="var(--color-primary-light)" />
                    Recent Analyses
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(ROUTES.ANALYSIS)}>
                    View all
                  </button>
                </div>

                {stats.recent_analyses.length === 0 ? (
                  <EmptyState
                    icon={<Target size={32} color="var(--color-primary-light)" />}
                    title="No analyses yet"
                    description="Upload a resume and add a job to get started"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {stats.recent_analyses.map((a) => {
                      const scoreInfo = getScoreInfo(a.match_score)
                      return (
                        <div
                          key={a.id}
                          className="card"
                          style={{
                            padding: 'var(--space-4)',
                            cursor: 'pointer',
                            marginBottom: 0,
                            border: '1px solid var(--color-border)',
                          }}
                          onClick={() => navigate(`${ROUTES.ANALYSIS}/${a.id}`)}
                        >
                          <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-primary)',
                              }}
                            >
                              {a.resume_name || 'Resume'} → {a.job_title || 'Job'}
                            </span>
                            <span style={{ fontWeight: 700, color: scoreInfo.color, fontSize: 'var(--font-size-base)' }}>
                              {a.match_score}%
                            </span>
                          </div>
                          <div className="flex-between">
                            <span className="badge badge-neutral" style={{ fontSize: 11 }}>
                              {scoreInfo.label}
                            </span>
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                              {formatRelativeTime(a.created_at)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Skills Overview */}
              <div>
                <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                  <h3
                    style={{
                      fontSize: 'var(--font-size-base)',
                      marginBottom: 'var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Sparkles size={18} color="var(--color-secondary)" />
                    Your Top Skills
                  </h3>
                  {stats.top_skills.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      Upload a resume to see your detected skills
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {stats.top_skills.map((skill) => (
                        <span key={skill} className="skill-tag skill-tag-match">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-base)',
                      marginBottom: 'var(--space-4)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Target size={18} color="var(--color-accent)" />
                    Skills to Develop
                  </h3>
                  {stats.missing_skills.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      Run a job analysis to identify skill gaps
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {stats.missing_skills.map((skill) => (
                        <span key={skill} className="skill-tag skill-tag-missing">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card" style={{ marginTop: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-4)' }}>Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate(ROUTES.RESUME)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <UploadCloud size={16} /> Upload Resume
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(ROUTES.JOBS)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} /> Add Job Description
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(ROUTES.ANALYSIS)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Target size={16} /> Run Match Analysis
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(ROUTES.CHAT)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <MessageSquare size={16} /> Ask AI Assistant
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
