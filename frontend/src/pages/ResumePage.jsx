/**
 * Resume Page — upload and manage resumes with Lucide icons and clean alignment.
 */
import { useState, useEffect, useRef } from 'react'
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  UploadCloud,
  Sparkles,
  User,
  Mail,
  Phone,
  Briefcase,
  FileCheck,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { resumeService } from '../services/resumeService'
import { Button, Loader, ErrorMessage, EmptyState } from '../components/common/index'
import { getErrorMessage, formatDate } from '../utils/formatters'

const UPLOAD_STEPS = [
  { label: 'Uploading file', icon: UploadCloud },
  { label: 'Extracting text', icon: FileText },
  { label: 'AI semantic parsing', icon: Sparkles },
  { label: 'Generating vector embeddings', icon: FileCheck },
  { label: 'Ready for match analysis', icon: CheckCircle2 },
]

function ResumeCard({ resume, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!confirm(`Delete "${resume.file_name}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await onDelete(resume.id)
    } finally {
      setDeleting(false)
    }
  }

  const parsed = resume.parsed_data || {}
  const skills = parsed.skills || []
  const isReady = resume.embedding_status === 'ready'
  const isFailed = resume.embedding_status === 'failed'

  return (
    <div
      className="card fade-in"
      style={{
        padding: 'var(--space-5)',
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Top Header Row — Perfectly Aligned */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Icon + File Details */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flex: 1, minWidth: 260 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(108, 99, 255, 0.12)',
              border: '1px solid rgba(108, 99, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-light)',
              flexShrink: 0,
            }}
          >
            <FileText size={24} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h4
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {resume.file_name}
            </h4>

            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <span
                className="badge badge-neutral"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                }}
              >
                {resume.file_type || 'PDF'}
              </span>

              <span
                className={`badge ${isReady ? 'badge-success' : isFailed ? 'badge-danger' : 'badge-warning'}`}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                }}
              >
                {isReady ? (
                  <>
                    <CheckCircle2 size={12} /> Ready
                  </>
                ) : isFailed ? (
                  <>
                    <AlertCircle size={12} /> Failed
                  </>
                ) : (
                  <>
                    <Loader2 size={12} className="spinner" /> Processing
                  </>
                )}
              </span>

              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Calendar size={12} /> {formatDate(resume.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
            }}
          >
            {expanded ? (
              <>
                <ChevronUp size={14} /> Hide Details
              </>
            ) : (
              <>
                <ChevronDown size={14} /> View Details
              </>
            )}
          </button>

          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
            }}
          >
            <Trash2 size={14} /> Delete
          </Button>
        </div>
      </div>

      {/* Expandable Details Section */}
      {expanded && (
        <div
          style={{
            marginTop: 'var(--space-5)',
            borderTop: '1px solid var(--color-border)',
            paddingTop: 'var(--space-5)',
          }}
        >
          {parsed.name && (
            <div
              className="flex gap-6"
              style={{
                marginBottom: 'var(--space-4)',
                flexWrap: 'wrap',
                background: 'rgba(255, 255, 255, 0.02)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="var(--color-primary-light)" />
                <div>
                  <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', display: 'block' }}>Candidate</span>
                  <strong style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>{parsed.name}</strong>
                </div>
              </div>

              {parsed.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={16} color="var(--color-secondary)" />
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', display: 'block' }}>Email</span>
                    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>{parsed.email}</span>
                  </div>
                </div>
              )}

              {parsed.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={16} color="var(--color-warning)" />
                  <div>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)', display: 'block' }}>Phone</span>
                    <span style={{ color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>{parsed.phone}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {skills.length > 0 && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Extracted Skills ({skills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 24).map((s) => (
                  <span key={s} className="skill-tag skill-tag-match">
                    {s}
                  </span>
                ))}
                {skills.length > 24 && (
                  <span className="badge badge-neutral">+{skills.length - 24} more</span>
                )}
              </div>
            </div>
          )}

          {parsed.summary && (
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Executive Summary
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 1.7,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {parsed.summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResumePage() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState(-1)
  const [dragover, setDragover] = useState(false)
  const fileRef = useRef(null)

  const loadResumes = async () => {
    try {
      const data = await resumeService.getAll()
      setResumes(data)
    } catch {
      setError('Failed to load resumes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResumes()
  }, [])

  const handleFile = async (file) => {
    if (!file) return
    const allowed = ['.pdf', '.docx', '.txt']
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) {
      setError('Only PDF, DOCX, and TXT files are supported')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be smaller than 10MB')
      return
    }

    setError('')
    setUploading(true)
    setUploadStep(0)

    try {
      setUploadStep(1)
      const result = await resumeService.upload(file, (e) => {
        if (e.loaded / e.total > 0.4) setUploadStep(2)
        if (e.loaded / e.total > 0.7) setUploadStep(3)
      })
      setUploadStep(4)
      setResumes((prev) => [result, ...prev])
      setTimeout(() => setUploadStep(-1), 1500)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragover(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDelete = async (id) => {
    await resumeService.delete(id)
    setResumes((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <DashboardLayout title="Resumes">
      <div className="page-content fade-in">
        <div className="page-header">
          <h2 className="page-title">Resumes</h2>
          <p className="page-subtitle">Upload and manage your resumes for AI match analysis</p>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Upload Zone */}
        {!uploading ? (
          <div
            className={`dropzone ${dragover ? 'dragover' : ''}`}
            style={{ marginBottom: 'var(--space-8)' }}
            onDragOver={(e) => {
              e.preventDefault()
              setDragover(true)
            }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="dropzone-icon" style={{ color: 'var(--color-primary-light)' }}>
              <UploadCloud size={36} />
            </div>
            <h3>Drop your resume here</h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>or click to browse your local files</p>
            <span className="badge badge-neutral">PDF • DOCX • TXT • Max 10MB</span>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,.txt"
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-lg)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={20} color="var(--color-primary-light)" />
              Processing your resume...
            </h3>
            <div className="upload-steps">
              {UPLOAD_STEPS.map((step, i) => {
                const StepIcon = step.icon
                const isCompleted = i < uploadStep
                const isActive = i === uploadStep

                return (
                  <div
                    key={step.label}
                    className={`upload-step ${isCompleted ? 'completed' : isActive ? 'active' : 'pending'}`}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
                      {isCompleted ? (
                        <CheckCircle2 size={18} color="var(--color-secondary)" />
                      ) : isActive ? (
                        <Loader2 size={18} className="spinner" color="var(--color-primary-light)" />
                      ) : (
                        <StepIcon size={18} color="var(--color-text-muted)" />
                      )}
                    </span>
                    <span>{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Resume List */}
        {loading ? (
          <Loader text="Loading resumes..." />
        ) : resumes.length === 0 ? (
          <EmptyState
            icon={<FileText size={32} color="var(--color-primary-light)" />}
            title="No resumes uploaded yet"
            description="Upload your first resume above to get started with AI-powered job matching"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="flex-between">
              <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {resumes.length} Resume{resumes.length !== 1 ? 's' : ''} Uploaded
              </h3>
            </div>

            {resumes.map((r) => (
              <ResumeCard key={r.id} resume={r} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
