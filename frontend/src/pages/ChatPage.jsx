/**
 * Chat Page — ChatGPT-style RAG-powered AI chat interface with Lucide icons.
 */
import { useState, useEffect, useRef } from 'react'
import {
  Bot,
  User,
  Send,
  Plus,
  MessageSquare,
  Paperclip,
  Sparkles,
  Loader2,
  FileText,
  Briefcase,
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import { chatService } from '../services/chatService'
import { resumeService } from '../services/resumeService'
import { jobService } from '../services/jobService'
import { Loader, ErrorMessage } from '../components/common/index'
import { getErrorMessage, formatRelativeTime, getInitials } from '../utils/formatters'
import { useAuth } from '../hooks/useAuth'

function SourceRef({ source }) {
  return (
    <span
      className="source-ref"
      title={`${source.document_type} - ${source.section}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <Paperclip size={11} /> {source.document_name} › {source.section}
    </span>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'
  const { user } = useAuth()

  return (
    <div className={`chat-message ${isUser ? 'user' : ''}`}>
      <div className={`message-avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? getInitials(user?.name || 'U') : <Bot size={18} />}
      </div>
      <div>
        <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75, margin: 0 }}>{message.content}</p>
          {!isUser && message.sources?.length > 0 && (
            <div className="message-sources" style={{ marginTop: 'var(--space-3)' }}>
              <p className="message-sources-title">Verified Sources</p>
              <div className="flex flex-wrap" style={{ gap: 4 }}>
                {message.sources.map((s, i) => (
                  <SourceRef key={i} source={s} />
                ))}
              </div>
            </div>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, padding: '0 4px' }}>
          {formatRelativeTime(message.created_at || new Date().toISOString())}
        </p>
      </div>
    </div>
  )
}

const SUGGESTED_QUESTIONS = [
  'What are my strongest skills according to my resume?',
  'Which critical skills am I missing for this job description?',
  'What projects from my resume are most relevant to this role?',
  'How should I prepare for technical interviews for this position?',
  'Summarize my experience with React and modern frontend frameworks.',
]

export default function ChatPage() {
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resumes, setResumes] = useState([])
  const [jobs, setJobs] = useState([])
  const [selectedResume, setSelectedResume] = useState('')
  const [selectedJob, setSelectedJob] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [convs, r, j] = await Promise.all([
          chatService.getConversations(),
          resumeService.getAll(),
          jobService.getAll(),
        ])
        setConversations(convs)
        setResumes(r)
        setJobs(j)
        if (r.length > 0) setSelectedResume(r[0].id)
        if (j.length > 0) setSelectedJob(j[0].id)
      } catch {
        setError('Failed to load chat history')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversation = async (convId) => {
    setActiveConvId(convId)
    try {
      const msgs = await chatService.getMessages(convId)
      setMessages(msgs)
    } catch {
      setError('Failed to load messages')
    }
  }

  const newChat = () => {
    setActiveConvId(null)
    setMessages([])
    inputRef.current?.focus()
  }

  const sendMessage = async (text) => {
    const question = (text || input).trim()
    if (!question || sending) return

    setInput('')
    setSending(true)
    setError('')

    const optimisticUser = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUser])

    try {
      const result = await chatService.sendMessage({
        question,
        conversationId: activeConvId,
        resumeId: selectedResume || undefined,
        jobId: selectedJob || undefined,
      })

      if (!activeConvId) {
        setActiveConvId(result.conversation_id)
        const convs = await chatService.getConversations()
        setConversations(convs)
      }

      const aiMessage = {
        id: result.message_id,
        role: 'assistant',
        content: result.answer,
        sources: result.sources,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      setError(getErrorMessage(err))
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <DashboardLayout title="AI Chat">
      {error && (
        <div style={{ padding: 'var(--space-4) var(--space-8)' }}>
          <ErrorMessage message={error} />
        </div>
      )}

      <div className="chat-layout">
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <button
              className="btn btn-primary"
              style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={newChat}
            >
              <Plus size={16} /> New Chat
            </button>
          </div>

          {/* Context selectors */}
          <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <span
              style={{
                fontSize: 10,
                color: 'var(--color-text-muted)',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: 'var(--space-2)',
              }}
            >
              RETRIEVAL CONTEXT
            </span>

            <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
              <label className="form-label" htmlFor="chat-resume" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FileText size={11} /> Resume
              </label>
              <select
                className="form-input"
                id="chat-resume"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
                style={{ fontSize: 'var(--font-size-xs)', padding: '6px 10px' }}
              >
                <option value="">All resumes</option>
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.file_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="chat-job" style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Briefcase size={11} /> Job Description
              </label>
              <select
                className="form-input"
                id="chat-job"
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                style={{ fontSize: 'var(--font-size-xs)', padding: '6px 10px' }}
              >
                <option value="">All jobs</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversations list */}
          <div className="chat-conversations">
            {conversations.map((c) => (
              <div
                key={c.id}
                className={`conversation-item ${activeConvId === c.id ? 'active' : ''}`}
                onClick={() => loadConversation(c.id)}
              >
                <p
                  style={{
                    fontWeight: 500,
                    color: activeConvId === c.id ? 'inherit' : 'var(--color-text-secondary)',
                    marginBottom: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  <MessageSquare size={13} /> {c.title}
                </p>
                <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 19 }}>
                  {formatRelativeTime(c.updated_at)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="chat-main">
          {loading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader text="Loading chat..." />
            </div>
          ) : (
            <>
              <div className="chat-messages">
                {messages.length === 0 && (
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        textAlign: 'center',
                        padding: 'var(--space-10) var(--space-6)',
                        maxWidth: 620,
                        margin: '0 auto',
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 'var(--radius-xl)',
                          background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          margin: '0 auto var(--space-4)',
                          boxShadow: '0 8px 24px rgba(108, 99, 255, 0.35)',
                        }}
                      >
                        <Sparkles size={28} />
                      </div>
                      <h3 style={{ marginBottom: 'var(--space-2)' }}>AI Career Assistant</h3>
                      <p
                        style={{
                          color: 'var(--color-text-muted)',
                          marginBottom: 'var(--space-6)',
                          fontSize: 'var(--font-size-sm)',
                          lineHeight: 1.6,
                        }}
                      >
                        Ask questions about your resume, identify skill gaps for your target job, or get interview advice.
                        All answers are grounded in your uploaded documents.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {SUGGESTED_QUESTIONS.map((q) => (
                          <button
                            key={q}
                            className="btn btn-ghost"
                            style={{
                              textAlign: 'left',
                              justifyContent: 'flex-start',
                              fontSize: 'var(--font-size-xs)',
                              padding: '10px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                            onClick={() => sendMessage(q)}
                          >
                            <MessageSquare size={14} color="var(--color-primary-light)" /> {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

                {sending && (
                  <div className="chat-message">
                    <div className="message-avatar ai">
                      <Bot size={18} />
                    </div>
                    <div className="message-bubble ai">
                      <div className="flex gap-2" style={{ alignItems: 'center' }}>
                        <Loader2 size={16} className="spinner" color="var(--color-primary-light)" />
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                          Retrieving document chunks & generating grounded response...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <div className="chat-input-area">
                <div className="chat-input-wrapper">
                  <textarea
                    ref={inputRef}
                    className="chat-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your resume or job... (Enter to send)"
                    rows={1}
                    disabled={sending}
                    style={{ lineHeight: 1.5 }}
                  />
                  <button
                    className="chat-send-btn"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || sending}
                    aria-label="Send message"
                  >
                    {sending ? <Loader2 size={16} className="spinner" /> : <Send size={16} />}
                  </button>
                </div>
                <p
                  style={{
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  Answers are grounded strictly in your uploaded documents via RAG.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
