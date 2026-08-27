/**
 * Landing Page — polished SaaS marketing page with Lucide icons.
 */
import { useNavigate } from 'react-router-dom'
import {
  Target,
  Search,
  MessageSquare,
  Mic,
  FileCheck,
  ShieldCheck,
  UploadCloud,
  Briefcase,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react'
import { ROUTES } from '../utils/constants'

const FEATURES = [
  {
    icon: Target,
    color: '#6c63ff',
    bg: 'rgba(108, 99, 255, 0.12)',
    title: 'AI Match Score',
    desc: 'Evidence-based compatibility scoring using Skills, Experience, Projects & ATS keywords — not random numbers.',
  },
  {
    icon: Search,
    color: '#00d4aa',
    bg: 'rgba(0, 212, 170, 0.12)',
    title: 'Skill Gap Analysis',
    desc: 'Instantly see which skills you have, which are partially matching, and which you are missing for the role.',
  },
  {
    icon: MessageSquare,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    title: 'RAG-Powered Chat',
    desc: 'Ask anything about your resume or job description. The AI retrieves relevant context — zero hallucinations.',
  },
  {
    icon: Mic,
    color: '#ffd166',
    bg: 'rgba(255, 209, 102, 0.12)',
    title: 'Interview Prep',
    desc: 'Get personalized interview questions by category and difficulty, tailored specifically to your profile and the role.',
  },
  {
    icon: FileCheck,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    title: 'ATS Optimization',
    desc: 'Identify missing ATS keywords and get actionable recommendations to improve your resume\'s pass rate.',
  },
  {
    icon: ShieldCheck,
    color: '#ff6b6b',
    bg: 'rgba(255, 107, 107, 0.12)',
    title: 'Secure by Design',
    desc: 'Your Gemini API key lives only on the backend. Your resume data is private and isolated to your account.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    icon: UploadCloud,
    title: 'Upload Your Resume',
    desc: 'PDF, DOCX, or TXT. We extract text, parse sections, and create dense semantic embeddings.',
  },
  {
    step: '2',
    icon: Briefcase,
    title: 'Add a Job Description',
    desc: 'Paste the JD or fill in the form. It gets embedded and prepared for multi-vector retrieval.',
  },
  {
    step: '3',
    icon: Cpu,
    title: 'Analyze Match',
    desc: 'Our RAG pipeline retrieves relevant content and Gemini generates a grounded, weighted analysis.',
  },
  {
    step: '4',
    icon: ArrowRight,
    title: 'Prepare & Apply',
    desc: 'Use generated interview questions, chat with AI, and apply with complete confidence.',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="container">
          <div className="landing-nav-inner">
            {/* Left: Brand Logo */}
            <div
              className="flex gap-3"
              style={{ alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate(ROUTES.HOME)}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  color: '#fff',
                  fontSize: 18,
                  boxShadow: '0 4px 14px rgba(108, 99, 255, 0.4)',
                }}
              >
                <Sparkles size={20} />
              </div>
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>ResumAI</span>
            </div>

            {/* Right: Auth Actions */}
            <div className="flex gap-3" style={{ alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate(ROUTES.LOGIN)}
                style={{ fontWeight: 600 }}
              >
                Log In
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(ROUTES.REGISTER)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
              >
                Get Started Free
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 840, margin: '0 auto' }}>
          <div
            className="badge badge-primary"
            style={{
              margin: '0 auto var(--space-6)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            <Sparkles size={14} /> Powered by Google Gemini & MongoDB Atlas Vector Search
          </div>

          <h1 className="hero-title fade-in">
            Understand exactly how well your resume{' '}
            <span className="gradient-text">matches the job</span>
          </h1>

          <p className="hero-subtitle fade-in">
            Upload your resume. Add a job description. Let real AI — not templates — tell you your match score,
            skill gaps, ATS keywords, and personalized preparation plan.
          </p>

          <div className="hero-cta fade-in">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate(ROUTES.REGISTER)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Start Analyzing for Free
              <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate(ROUTES.LOGIN)}>
              I have an account
            </button>
          </div>

          {/* Mini stats */}
          <div
            className="flex gap-8"
            style={{ marginTop: 'var(--space-12)', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {[
              { label: 'Real RAG Pipeline', icon: CheckCircle2, color: '#00d4aa' },
              { label: 'Evidence-based Scoring', icon: Target, color: '#6c63ff' },
              { label: 'API Key Never Exposed', icon: Lock, color: '#ffd166' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="flex gap-2" style={{ alignItems: 'center' }}>
                  <Icon size={18} color={s.color} />
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>Everything you need to land the role</h2>
            <p style={{ color: 'var(--color-text-muted)', maxWidth: 520, margin: '0 auto' }}>
              Powered by a real RAG pipeline — not static templates or fake AI responses.
            </p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="feature-card fade-in">
                  <div className="feature-icon" style={{ background: f.bg, color: f.color }}>
                    <Icon size={28} />
                  </div>
                  <h3>{f.title}</h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ marginBottom: 'var(--space-4)' }}>How it works</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>From resume to offer in 4 simple steps.</p>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-8)',
              maxWidth: 640,
              margin: '0 auto',
            }}
          >
            {HOW_IT_WORKS.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.step} className="step-item fade-in" style={{ display: 'flex', gap: 'var(--space-5)' }}>
                  <div className="step-number" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.step}
                  </div>
                  <div>
                    <h4 style={{ marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={18} color="var(--color-primary-light)" />
                      {s.title}
                    </h4>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', lineHeight: 1.6 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Technical Architecture */}
      <section style={{ padding: 'var(--space-16) 0', background: 'var(--color-bg-secondary)' }}>
        <div className="container">
          <div style={{ maxWidth: 740, margin: '0 auto', textAlign: 'center' }}>
            <div
              className="badge badge-primary"
              style={{
                marginBottom: 'var(--space-4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Layers size={14} /> Technical Architecture
            </div>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>Real Retrieval-Augmented Generation</h2>
            <p
              style={{
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-8)',
                fontSize: 'var(--font-size-base)',
                lineHeight: 1.7,
              }}
            >
              Unlike tools that dump full documents into an unstructured prompt, ResumAI creates a dense vector index
              with MongoDB Atlas. When you run analysis or ask questions, only the top semantic matches are retrieved
              and sent to Gemini.
            </p>
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-6)',
                fontFamily: 'monospace',
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                textAlign: 'left',
                lineHeight: 2.2,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <span style={{ color: 'var(--color-secondary)' }}>Document</span>
              {' → '}
              <span style={{ color: 'var(--color-primary-light)' }}>Chunks</span>
              {' → '}
              <span style={{ color: 'var(--color-secondary)' }}>Embeddings</span>
              {' → '}
              <span style={{ color: 'var(--color-warning)' }}>Atlas Vector Search</span>
              <br />
              <span style={{ color: 'var(--color-warning)' }}>Query Embedding</span>
              {' → '}
              <span style={{ color: 'var(--color-primary-light)' }}>Semantic Retrieval</span>
              {' → '}
              <span style={{ color: 'var(--color-secondary)' }}>Context</span>
              {' → '}
              <span style={{ color: '#ff9f43' }}>Gemini</span>
              {' → '}
              <span style={{ color: 'var(--color-secondary)' }}>Grounded Answer ✅</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: 'var(--space-16) 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ marginBottom: 'var(--space-4)' }}>Ready to land your next role?</h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--space-8)',
              fontSize: 'var(--font-size-lg)',
            }}
          >
            Free to use. No credit card required. Start analyzing in minutes.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate(ROUTES.REGISTER)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            Create Free Account
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: 'var(--space-8) 0',
          background: 'var(--color-bg-secondary)',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        <div className="container">
          <p>
            <strong style={{ color: 'var(--color-primary-light)' }}>ResumAI</strong>
            {' — AI Job & Resume Intelligence Platform. Built with FastAPI, React, MongoDB Atlas, & Google Gemini.'}
          </p>
        </div>
      </footer>
    </div>
  )
}
