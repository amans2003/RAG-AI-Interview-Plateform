import api from './api'

export const chatService = {
  async sendMessage({ question, conversationId, resumeId, jobId }) {
    const res = await api.post('/chat', {
      question,
      conversation_id: conversationId || undefined,
      resume_id: resumeId || undefined,
      job_id: jobId || undefined,
    })
    return res.data.data
  },

  async getConversations() {
    const res = await api.get('/chat/conversations')
    return res.data.data
  },

  async getMessages(conversationId) {
    const res = await api.get(`/chat/conversations/${conversationId}`)
    return res.data.data
  },
}
