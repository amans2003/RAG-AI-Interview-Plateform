import api from './api'

export const resumeService = {
  async upload(file, onUploadProgress) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
      timeout: 120000, // 2 mins for large files + AI processing
    })
    return res.data.data
  },

  async getAll() {
    const res = await api.get('/resumes')
    return res.data.data
  },

  async getById(id) {
    const res = await api.get(`/resumes/${id}`)
    return res.data.data
  },

  async delete(id) {
    await api.delete(`/resumes/${id}`)
  },
}
