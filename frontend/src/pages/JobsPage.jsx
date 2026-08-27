/**
 * Jobs Page — create and manage job descriptions with Lucide icons.
 */
import { useState, useEffect } from 'react'
import {
  Briefcase,
  Building2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Sparkles,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { jobService } from '../services/jobService'
import { Button, Input, Textarea, Modal, Loader, ErrorMessage, EmptyState } from '../components/common/index'
import { getErrorMessage, formatDate } from '../utils/formatters'

function JobForm({ onSubmit, initialData, loading }) {
  const [form, setForm] = useState({
    company: initialData?.company || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    experience_required: initialData?.experience_required || '',
    skills: initialData?.skills?.join(', ') || '',
  })

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      ...form,
      skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
        <Input
          id="company"
          label="Company Name"
          value={form.company}
          onChange={handleChange('company')}
          placeholder="e.g. Google, Stripe"
          required
        />
        <Input
          id="job-title"
          label="Job Title"
          value={form.title}
          onChange={handleChange('title')}
          placeholder="e.g. Senior Full-Stack Engineer"
          required
        />
      </div>

      <Textarea
        id="description"
        label="Job Description"
        value={form.description}
        onChange={handleChange('description')}
        placeholder="Paste the full job description or requirements here..."
        required
        style={{ minHeight: 180 }}
      />

      <div className="grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
        <Input
          id="experience"
          label="Experience Required"
          value={form.experience_required}
          onChange={handleChange('experience_required')}
          placeholder="e.g. 3+ years"
        />
        <Input
          id="skills"
          label="Key Skills (comma-separated)"
          value={form.skills}
          onChange={handleChange('skills')}
          placeholder="React, TypeScript, MongoDB"
        />
      </div>

      <Button
        type="submit"
        loading={loading}
        style={{ width: '100%', marginTop: 'var(--space-4)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        {loading ? 'Saving...' : initialData ? 'Update Job Description' : 'Add Job Description'}
      </Button>
    </form>
  )
}

function JobCard({ job, onDelete, onEdit }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete "${job.title} at ${job.company}"?`)) return
    setDeleting(true)
    try {
      await onDelete(job.id)
    } finally {
      setDeleting(false)
    }
  }

  const isReady = job.embedding_status === 'ready'

  return (
    <div className="card fade-in" style={{ padding: 'var(--space-5)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-md)',
              background: 'rgba(0, 212, 170, 0.12)',
              border: '1px solid rgba(0, 212, 170, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-secondary)',
              flexShrink: 0,
            }}
          >
            <Briefcase size={22} />
          </div>

          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {job.title}
            </h3>

            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <span
                style={{
                  color: 'var(--color-primary-light)',
                  fontWeight: 600,
                  fontSize: 'var(--font-size-xs)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Building2 size={13} /> {job.company}
              </span>

              <span
                className={`badge ${isReady ? 'badge-success' : job.embedding_status === 'failed' ? 'badge-danger' : 'badge-warning'}`}
                style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {isReady ? (
                  <>
                    <CheckCircle2 size={11} /> Ready
                  </>
                ) : job.embedding_status === 'failed' ? (
                  <>
                    <AlertCircle size={11} /> Failed
                  </>
                ) : (
                  <>
                    <Loader2 size={11} className="spinner" /> Processing
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
                <Calendar size={12} /> {formatDate(job.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(job)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Edit3 size={13} /> Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Trash2 size={13} /> Delete
          </Button>
        </div>
      </div>

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--space-4)',
          lineHeight: 1.7,
        }}
      >
        {job.description.slice(0, 240)}
        {job.description.length > 240 ? '...' : ''}
      </p>

      {job.experience_required && (
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Sparkles size={13} color="var(--color-warning)" /> Experience: {job.experience_required}
        </p>
      )}

      {job.skills?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 16).map((s) => (
            <span key={s} className="badge badge-primary" style={{ fontSize: 11 }}>
              {s}
            </span>
          ))}
          {job.skills.length > 16 && <span className="badge badge-neutral">+{job.skills.length - 16} more</span>}
        </div>
      )}
    </div>
  )
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editJob, setEditJob] = useState(null)

  const load = async () => {
    try {
      const data = await jobService.getAll()
      setJobs(data)
    } catch {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (data) => {
    setSaving(true)
    setError('')
    try {
      if (editJob) {
        const updated = await jobService.update(editJob.id, data)
        setJobs((prev) => prev.map((j) => (j.id === editJob.id ? updated : j)))
      } else {
        const created = await jobService.create(data)
        setJobs((prev) => [created, ...prev])
      }
      setModalOpen(false)
      setEditJob(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    await jobService.delete(id)
    setJobs((prev) => prev.filter((j) => j.id !== id))
  }

  const openEdit = (job) => {
    setEditJob(job)
    setModalOpen(true)
  }
  const openCreate = () => {
    setEditJob(null)
    setModalOpen(true)
  }

  return (
    <DashboardLayout title="Jobs">
      <div className="page-content fade-in">
        <div className="page-header flex-between">
          <div>
            <h2 className="page-title">Job Descriptions</h2>
            <p className="page-subtitle">Add job postings to compare and analyze against your resumes</p>
          </div>
          <Button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Job
          </Button>
        </div>

        {error && <ErrorMessage message={error} />}

        {loading ? (
          <Loader text="Loading jobs..." />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={32} color="var(--color-primary-light)" />}
            title="No jobs added yet"
            description="Add a job description to start analyzing your resume match"
            action={
              <Button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> Add your first job
              </Button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="flex-between">
              <h3 style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                {jobs.length} Job Description{jobs.length !== 1 ? 's' : ''} Added
              </h3>
            </div>
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} onDelete={handleDelete} onEdit={openEdit} />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditJob(null)
        }}
        title={editJob ? 'Edit Job Description' : 'Add Job Description'}
        maxWidth="640px"
      >
        <JobForm onSubmit={handleSubmit} initialData={editJob} loading={saving} />
      </Modal>
    </DashboardLayout>
  )
}
