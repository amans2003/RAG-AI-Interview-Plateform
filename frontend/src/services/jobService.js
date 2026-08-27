import api from './api'

export const jobService = {
  async create(data) {
    const res = await api.post('/jobs', data)
    return res.data.data
  },

  async getAll() {
    const res = await api.get('/jobs')
    return res.data.data
  },

  async getById(id) {
    const res = await api.get(`/jobs/${id}`)
    return res.data.data
  },

  async update(id, data) {
    const res = await api.put(`/jobs/${id}`, data)
    return res.data.data
  },

  async delete(id) {
    await api.delete(`/jobs/${id}`)
  },
}
