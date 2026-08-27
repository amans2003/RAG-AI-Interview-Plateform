import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/formatters'
import { ROUTES } from '../utils/constants'
import { Button, Input, ErrorMessage } from '../components/common/index'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
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
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your ResumAI account</p>
        </div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-5)' }}>
          <Input
            id="email"
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            autoComplete="email"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />
          <Button
            type="submit"
            loading={loading}
            disabled={!email || !password}
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
              'Signing in...'
            ) : (
              <>
                Sign In <ArrowRight size={16} />
              </>
            )}
          </Button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to={ROUTES.REGISTER}>Create one free</Link>
        </div>
      </div>
    </div>
  )
}
