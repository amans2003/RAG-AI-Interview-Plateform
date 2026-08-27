// Application constants
export const APP_NAME = 'ResumAI'
export const APP_TAGLINE = 'AI Job & Resume Intelligence Platform'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  RESUME: '/resumes',
  JOBS: '/jobs',
  ANALYSIS: '/analysis',
  INTERVIEW: '/interview',
  CHAT: '/chat',
  PROFILE: '/profile',
}

export const DIFFICULTY_COLORS = {
  Easy: 'badge-success',
  Medium: 'badge-warning',
  Hard: 'badge-danger',
}

export const SCORE_LABELS = {
  excellent: { label: 'Excellent Match', color: '#00d4aa', min: 85 },
  good: { label: 'Strong Match', color: '#6c63ff', min: 70 },
  fair: { label: 'Moderate Match', color: '#ffd166', min: 50 },
  poor: { label: 'Low Match', color: '#ff6b6b', min: 0 },
}

export const getScoreInfo = (score) => {
  if (score >= 85) return SCORE_LABELS.excellent
  if (score >= 70) return SCORE_LABELS.good
  if (score >= 50) return SCORE_LABELS.fair
  return SCORE_LABELS.poor
}
