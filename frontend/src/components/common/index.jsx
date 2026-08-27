// Common reusable components

export function Button({ children, variant = 'primary', size = '', onClick, disabled, loading, type = 'button', className = '', ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`}
      {...props}
    >
      {loading && <span className="spinner spinner-sm" />}
      {children}
    </button>
  )
}

export function Input({ label, error, hint, id, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <input
        id={id}
        className={`form-input ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  )
}

export function Textarea({ label, error, hint, id, className = '', ...props }) {
  return (
    <div className="form-group">
      {label && <label htmlFor={id} className="form-label">{label}</label>}
      <textarea
        id={id}
        className={`form-input form-textarea ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  )
}

export function Modal({ isOpen, onClose, title, children, maxWidth = '520px' }) {
  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Loader({ text = 'Loading...', size = '' }) {
  return (
    <div className="loading-state">
      <div className={`spinner ${size ? `spinner-${size}` : ''}`} />
      {text && <p>{text}</p>}
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="alert alert-error fade-in">
      <span>⚠️</span>
      <div style={{ flex: 1 }}>
        <span>{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{ marginLeft: 12, color: 'var(--color-primary-light)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function Badge({ children, variant = 'neutral' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}

export function ProgressBar({ value, max = 100, variant = 'primary' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="progress-bar-container">
      <div
        className={`progress-bar progress-bar-${variant}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
