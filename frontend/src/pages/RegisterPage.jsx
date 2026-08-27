import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/formatters'
import { ROUTES } from '../utils/constants'
import { Button, Input, ErrorMessage } from '../components/common/index'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate(ROUTES.DASHBOARD)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card scale-in">
        <div className="auth-header">
          <Link
            to={ROUTES.HOME}
            style={{ display: 'inline-flex', textDecoration: 'none', marginBottom: 'var(--space-4)' }}
          >
            <div className="auth-logo">
              <Sparkles size={24} />
            </div>
          </Link>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start analyzing your resume vs jobs — free forever</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-5)' }}>
          <Input
            id="name"
            label="Full name"
            type="text"
            value={form.name}
            onChange={handleChange('name')}
            placeholder="e.g. Aman Singh"
            required
            autoFocus
            autoComplete="name"
          />
          <Input
            id="email"
            label="Email address"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            placeholder="At least 8 characters"
            required
            hint="Minimum 8 characters"
            autoComplete="new-password"
          />
          <Button
            type="submit"
            loading={loading}
            disabled={!form.name || !form.email || !form.password}
            style={{
              width: '100%',
              marginTop: 'var(--space-3)',
              minHeight: '48px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              'Creating account...'
            ) : (
              <>
                Create Account <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}
