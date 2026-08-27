/**
 * Formatting utilities.
 */

export const formatDate = (isoString) => {
  if (!isoString) return ''
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(isoString))
  } catch {
    return isoString
  }
}

export const formatRelativeTime = (isoString) => {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return formatDate(isoString)
  } catch {
    return isoString
  }
}

export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const truncate = (str, maxLength = 50) => {
  if (!str) return ''
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

export const getErrorMessage = (error) => {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message
  }
  if (error?.response?.data?.detail) {
    return error.response.data.detail
  }
  if (error?.message) {
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}

export const getFileIcon = (fileType) => {
  const icons = { pdf: '📄', docx: '📝', txt: '📃' }
  return icons[fileType?.toLowerCase()] || '📎'
}

export { getScoreInfo } from './constants'

