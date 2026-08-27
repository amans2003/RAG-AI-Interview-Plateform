import api from './api'

export const analysisService = {
  async analyze(resumeId, jobId) {
    const res = await api.post('/analysis', { resume_id: resumeId, job_id: jobId })
    return res.data.data
  },

  async getAll() {
    const res = await api.get('/analysis')
    return res.data.data
  },

  async getById(id) {
    const res = await api.get(`/analysis/${id}`)
    return res.data.data
  },

  async getDashboardStats() {
    const res = await api.get('/analysis/dashboard/stats')
    return res.data.data
  },
}

export const interviewService = {
  async generate(resumeId, jobId, analysisId) {
    const res = await api.post('/interview/generate', {
      resume_id: resumeId,
      job_id: jobId,
      analysis_id: analysisId || undefined,
    })
    return res.data.data
  },

  async getAll() {
    const res = await api.get('/interview')
    return res.data.data
  },
}
