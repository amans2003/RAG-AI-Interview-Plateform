/**
 * Analysis Page — run analysis and view results with Lucide icons.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  Mic,
  MessageSquare,
  Briefcase,
  FileText,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { analysisService } from '../services/analysisService'
import { resumeService } from '../services/resumeService'
import { jobService } from '../services/jobService'
import { Button, Loader, ErrorMessage, EmptyState } from '../components/common/index'
import { getErrorMessage, formatDate } from '../utils/formatters'
import { getScoreInfo as getScore, ROUTES } from '../utils/constants'

// Score Ring
function ScoreRing({ score }) {
  const info = getScore(score)
  const radius = 75
  const stroke = 8
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="score-ring-container">
      <div className="score-ring" style={{ width: 180, height: 180 }}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            strokeWidth={stroke}
            stroke="rgba(255,255,255,0.06)"
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            strokeWidth={stroke}
            stroke={info.color}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.5s ease' }}
          />
        </svg>
        <div className="score-ring-value">
          <div className="score-number" style={{ color: info.color }}>
            {score}
          </div>
          <div className="score-label">/ 100</div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: info.color }}>
          {info.label}
        </div>
      </div>
    </div>
  )
}

// Sub-score bar
function SubScore({ label, value }) {
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div className="flex-between" style={{ marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700 }}>{value}%</span>
      </div>
      <div className="progress-bar-container" style={{ height: 6 }}>
        <div className="progress-bar progress-bar-primary" style={{ width: `${value}%`, transition: 'width 1.2s ease' }} />
      </div>
    </div>
  )
}

// Analysis Result
function AnalysisResult({ analysis, onGenerateInterview, generatingInterview }) {
  const navigate = useNavigate()
  return (
    <div className="fade-in">
      <div className="card" style={{ marginBottom: 'var(--space-6)', borderColor: 'rgba(108, 99, 255, 0.25)' }}>
        <div className="flex-between" style={{ marginBottom: 'var(--space-2)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <span
              style={{
                fontSize: 10,
                color: 'var(--color-primary-light)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              RAG MATCH REPORT
            </span>
            <h3 style={{ fontSize: 'var(--font-size-lg)', marginTop: 2 }}>
              {analysis.resume_name} → {analysis.job_title}
            </h3>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} /> {formatDate(analysis.created_at)}
          </span>
        </div>

        <div className="grid-2" style={{ gap: 'var(--space-6)', marginTop: 'var(--space-6)' }}>
          {/* Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <ScoreRing score={analysis.match_score} />
            <div className="card card-gradient" style={{ padding: 'var(--space-4)', width: '100%', margin: 0 }}>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                {analysis.summary}
              </p>
            </div>
          </div>

          {/* Sub-scores breakdown */}
          <div>
            <h4 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="var(--color-primary-light)" />
              Weighted Compatibility
            </h4>
            <SubScore
              label="Skills Match (40%)"
              value={Math.round(
                (analysis.matching_skills.length /
                  Math.max(analysis.matching_skills.length + analysis.missing_skills.length, 1)) *
                  100
              )}
            />
            <SubScore
              label="ATS Keywords (10%)"
              value={Math.round(
                (analysis.ats_keywords_present.length /
                  Math.max(analysis.ats_keywords_present.length + analysis.ats_keywords_missing.length, 1)) *
                  100
              )}
            />
            <SubScore label="Overall Composite Match" value={analysis.match_score} />
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {/* Matching Skills */}
        <div className="card">
          <h4
            style={{
              marginBottom: 'var(--space-4)',
              color: 'var(--color-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--font-size-base)',
            }}
          >
            <CheckCircle2 size={18} /> Matching Skills ({analysis.matching_skills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.matching_skills.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>None identified</p>
            ) : (
              analysis.matching_skills.map((s) => (
                <span key={s} className="skill-tag skill-tag-match">
                  {s}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Missing Skills */}
        <div className="card">
          <h4
            style={{
              marginBottom: 'var(--space-4)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--font-size-base)',
            }}
          >
            <XCircle size={18} /> Missing Skills ({analysis.missing_skills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_skills.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>No gaps identified!</p>
            ) : (
              analysis.missing_skills.map((s) => (
                <span key={s} className="skill-tag skill-tag-missing">
                  {s}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Experience & Projects */}
      <div className="grid-2" style={{ gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        {analysis.experience_analysis && (
          <div className="card">
            <h4
              style={{
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 'var(--font-size-base)',
              }}
            >
              <Briefcase size={18} color="var(--color-primary-light)" /> Experience Analysis
            </h4>
            <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
              {analysis.experience_analysis}
            </p>
          </div>
        )}

        {analysis.project_analysis && (
          <div className="card">
            <h4
              style={{
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 'var(--font-size-base)',
              }}
            >
              <Layers size={18} color="var(--color-warning)" /> Project Relevance
            </h4>
            <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
              {analysis.project_analysis}
            </p>
          </div>
        )}
      </div>

      {/* ATS */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <h4 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>
          📋 ATS Keyword Analysis
        </h4>
        <div className="grid-2" style={{ gap: 'var(--space-4)' }}>
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-secondary)',
                fontWeight: 600,
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CheckCircle2 size={12} /> PRESENT IN RESUME
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.ats_keywords_present.map((k) => (
                <span key={k} className="skill-tag skill-tag-match">
                  {k}
                </span>
              ))}
              {analysis.ats_keywords_present.length === 0 && (
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>None identified</span>
              )}
            </div>
          </div>
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-accent)',
                fontWeight: 600,
                marginBottom: 'var(--space-3)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <XCircle size={12} /> MISSING FROM RESUME
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.ats_keywords_missing.map((k) => (
                <span key={k} className="skill-tag skill-tag-missing">
                  {k}
                </span>
              ))}
              {analysis.ats_keywords_missing.length === 0 && (
                <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>None missing!</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations?.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h4
            style={{
              marginBottom: 'var(--space-4)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 'var(--font-size-base)',
            }}
          >
            <Lightbulb size={18} color="var(--color-warning)" /> Actionable Recommendations
          </h4>
          <ol style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {analysis.recommendations.map((r, i) => (
              <li key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(108, 99, 255, 0.15)',
                    color: 'var(--color-primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <p style={{ fontSize: 'var(--font-size-sm)', lineHeight: 1.7, color: 'var(--color-text-secondary)' }}>
                  {r}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4 flex-wrap">
        <Button
          onClick={() => onGenerateInterview(analysis)}
          loading={generatingInterview}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Mic size={16} /> Generate Interview Questions
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate(ROUTES.CHAT)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <MessageSquare size={16} /> Ask AI Career Assistant
        </Button>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  const [resumes, setResumes] = useState([])
  const [jobs, setJobs] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingInterview, setGeneratingInterview] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [r, j, a] = await Promise.all([
          resumeService.getAll(),
          jobService.getAll(),
          analysisService.getAll(),
        ])
        setResumes(r)
        setJobs(j)
        setAnalyses(a)
        if (a.length > 0) setCurrentAnalysis(a[0])
      } catch {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAnalyze = async () => {
    if (!selectedResume || !selectedJob) return
    setError('')
    setAnalyzing(true)
    try {
      const result = await analysisService.analyze(selectedResume, selectedJob)
      setCurrentAnalysis(result)
      setAnalyses((prev) => [result, ...prev])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateInterview = async (analysis) => {
    setGeneratingInterview(true)
    try {
      navigate(`${ROUTES.INTERVIEW}?resume=${analysis.resume_id}&job=${analysis.job_id}&analysis=${analysis.id}`)
    } finally {
      setGeneratingInterview(false)
    }
  }

  return (
    <DashboardLayout title="Analysis">
      <div className="page-content fade-in">
        <div className="page-header">
          <h2 className="page-title">Resume Analysis</h2>
          <p className="page-subtitle">AI-powered match score with real RAG retrieval & ATS breakdown</p>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <Loader text="Loading analysis..." />
        ) : (
          <>
            {/* Selector */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Target size={18} color="var(--color-primary-light)" />
                Run New Analysis
              </h3>

              {resumes.length === 0 && (
                <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
                  <FileText size={16} />
                  <span>
                    No resumes yet.{' '}
                    <button
                      onClick={() => navigate(ROUTES.RESUME)}
                      style={{
                        color: 'var(--color-primary-light)',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Upload one first →
                    </button>
                  </span>
                </div>
              )}

              {jobs.length === 0 && (
                <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
                  <Briefcase size={16} />
                  <span>
                    No jobs yet.{' '}
                    <button
                      onClick={() => navigate(ROUTES.JOBS)}
                      style={{
                        color: 'var(--color-primary-light)',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Add one first →
                    </button>
                  </span>
                </div>
              )}

              <div className="grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="select-resume">
                    Select Resume
                  </label>
                  <select
                    className="form-input"
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    id="select-resume"
                  >
                    <option value="">-- Choose a resume --</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.file_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="select-job">
                    Select Job
                  </label>
                  <select
                    className="form-input"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    id="select-job"
                  >
                    <option value="">-- Choose a job --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} at {j.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                loading={analyzing}
                disabled={!selectedResume || !selectedJob}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Sparkles size={16} />
                {analyzing ? 'Analyzing with AI...' : 'Analyze Match'}
              </Button>
            </div>

            {/* Current / Latest Result */}
            {currentAnalysis && (
              <AnalysisResult
                analysis={currentAnalysis}
                onGenerateInterview={handleGenerateInterview}
                generatingInterview={generatingInterview}
              />
            )}

            {/* Previous analyses */}
            {analyses.length > 1 && (
              <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-base)' }}>Previous Analyses</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {analyses.slice(1).map((a) => {
                    const info = getScore(a.match_score)
                    return (
                      <div
                        key={a.id}
                        className="card"
                        style={{ padding: 'var(--space-4)', cursor: 'pointer', marginBottom: 0 }}
                        onClick={() => setCurrentAnalysis(a)}
                      >
                        <div className="flex-between">
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 'var(--font-size-sm)',
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {a.resume_name} → {a.job_title}
                          </span>
                          <span style={{ fontWeight: 700, color: info.color }}>{a.match_score}%</span>
                        </div>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                          {formatDate(a.created_at)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {analyses.length === 0 && !currentAnalysis && (
              <EmptyState
                icon={<Target size={32} color="var(--color-primary-light)" />}
                title="No analyses yet"
                description="Select a resume and job above to run your first AI analysis"
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
