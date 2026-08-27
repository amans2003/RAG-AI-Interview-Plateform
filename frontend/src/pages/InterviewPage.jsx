/**
 * Interview Page — generate and view personalized interview questions with Lucide icons.
 */
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Mic,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { interviewService } from '../services/analysisService'
import { resumeService } from '../services/resumeService'
import { jobService } from '../services/jobService'
import { Button, Loader, ErrorMessage, EmptyState, Badge } from '../components/common/index'
import { getErrorMessage } from '../utils/formatters'

const CATEGORIES = ['All', 'Technical', 'Behavioral', 'Project', 'System Design']
const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard']
const DIFF_VARIANT = { Easy: 'success', Medium: 'warning', Hard: 'danger' }

function QuestionCard({ question, index }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="question-card fade-in" style={{ padding: 'var(--space-5)' }}>
      <div className="question-header" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        <div
          className="question-number"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(108, 99, 255, 0.15)',
            color: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          {index + 1}
        </div>
        <p className="question-text" style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
          {question.question}
        </p>
      </div>

      <div className="question-meta" style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Badge variant={DIFF_VARIANT[question.difficulty] || 'neutral'}>{question.difficulty}</Badge>
        <Badge variant="primary">{question.category}</Badge>
      </div>

      {question.why_asked && (
        <button
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-primary-light)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginTop: 'var(--space-3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 600,
          }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp size={13} /> Hide context
            </>
          ) : (
            <>
              <ChevronDown size={13} /> Why this question?
            </>
          )}
        </button>
      )}

      {expanded && question.why_asked && (
        <div className="question-why" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
          {question.why_asked}
        </div>
      )}

      {expanded && question.expected_topics?.length > 0 && (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <p
            style={{
              fontSize: 10,
              color: 'var(--color-text-muted)',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-2)',
            }}
          >
            COVER IN YOUR ANSWER:
          </p>
          <div className="flex flex-wrap gap-2">
            {question.expected_topics.map((t) => (
              <span key={t} className="badge badge-neutral" style={{ fontSize: 11 }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function InterviewPage() {
  const [searchParams] = useSearchParams()
  const [resumes, setResumes] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedResume, setSelectedResume] = useState(searchParams.get('resume') || '')
  const [selectedJob, setSelectedJob] = useState(searchParams.get('job') || '')
  const [analysisId] = useState(searchParams.get('analysis') || '')
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterDiff, setFilterDiff] = useState('All')

  useEffect(() => {
    const load = async () => {
      try {
        const [r, j] = await Promise.all([resumeService.getAll(), jobService.getAll()])
        setResumes(r)
        setJobs(j)
      } catch {
        setError('Failed to load resumes and jobs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleGenerate = async () => {
    if (!selectedResume || !selectedJob) return
    setError('')
    setGenerating(true)
    try {
      const result = await interviewService.generate(selectedResume, selectedJob, analysisId)
      setQuestions(result.questions || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setGenerating(false)
    }
  }

  const filtered = questions.filter((q) => {
    if (filterCategory !== 'All' && q.category !== filterCategory) return false
    if (filterDiff !== 'All' && q.difficulty !== filterDiff) return false
    return true
  })

  return (
    <DashboardLayout title="Interview Prep">
      <div className="page-content fade-in">
        <div className="page-header">
          <h2 className="page-title">Interview Preparation</h2>
          <p className="page-subtitle">AI-generated questions tailored to your specific resume & target job</p>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <Loader text="Loading resumes and jobs..." />
        ) : (
          <>
            {/* Generator Form */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
              <h3
                style={{
                  marginBottom: 'var(--space-4)',
                  fontSize: 'var(--font-size-base)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Mic size={18} color="var(--color-primary-light)" />
                Generate Tailored Questions
              </h3>

              <div className="grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="interview-resume">
                    Resume
                  </label>
                  <select
                    className="form-input"
                    value={selectedResume}
                    onChange={(e) => setSelectedResume(e.target.value)}
                    id="interview-resume"
                  >
                    <option value="">-- Choose resume --</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.file_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="interview-job">
                    Job Description
                  </label>
                  <select
                    className="form-input"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    id="interview-job"
                  >
                    <option value="">-- Choose job --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title} at {j.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                loading={generating}
                disabled={!selectedResume || !selectedJob}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Sparkles size={16} />
                {generating ? 'Generating Questions with AI...' : 'Generate Questions'}
              </Button>
            </div>

            {questions.length > 0 && (
              <>
                {/* Filters */}
                <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4)' }}>
                  <div
                    className="flex gap-4"
                    style={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--color-text-muted)',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          CATEGORY
                        </span>
                        <div className="flex gap-1 flex-wrap">
                          {CATEGORIES.map((c) => (
                            <button
                              key={c}
                              className={`badge ${filterCategory === c ? 'badge-primary' : 'badge-neutral'}`}
                              style={{ cursor: 'pointer', fontSize: 11 }}
                              onClick={() => setFilterCategory(c)}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            color: 'var(--color-text-muted)',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          DIFFICULTY
                        </span>
                        <div className="flex gap-1">
                          {DIFFICULTIES.map((d) => (
                            <button
                              key={d}
                              className={`badge ${filterDiff === d ? 'badge-primary' : 'badge-neutral'}`}
                              style={{ cursor: 'pointer', fontSize: 11 }}
                              onClick={() => setFilterDiff(d)}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Showing {filtered.length} of {questions.length} questions
                    </span>
                  </div>
                </div>

                {/* Questions list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {filtered.length === 0 ? (
                    <EmptyState
                      icon={<SlidersHorizontal size={32} color="var(--color-text-muted)" />}
                      title="No questions match filters"
                      description="Try clearing or changing your category or difficulty filter"
                    />
                  ) : (
                    filtered.map((q, i) => <QuestionCard key={i} question={q} index={i} />)
                  )}
                </div>
              </>
            )}

            {questions.length === 0 && !generating && (
              <EmptyState
                icon={<Mic size={32} color="var(--color-primary-light)" />}
                title="No questions generated yet"
                description="Select a resume and job above to generate personalized interview questions"
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
