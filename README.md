# 🤖 ResumAI — AI Job & Resume Intelligence Platform

A production-quality, full-stack web application that uses **real AI and RAG** to analyze your resume against job descriptions, identify skill gaps, generate interview questions, and let you chat with an AI grounded in your uploaded documents.

> **Portfolio Note:** This project demonstrates: FastAPI + async Python, MongoDB Atlas + Vector Search, Google Gemini integration, real RAG pipeline implementation, JWT auth, and modern React/Vite frontend.

---

## ✨ Features

- 📄 **Resume Upload** — PDF, DOCX, TXT support with AI parsing
- 💼 **Job Management** — Add jobs via form or paste JD
- 🎯 **AI Match Analysis** — Evidence-based scoring (not random numbers)
  - Skills match (40%), Experience (25%), Projects (15%), Keywords (10%), Education (10%)
- 🔍 **Skill Gap Analysis** — Matched, partial, and missing skills
- 📋 **ATS Keyword Analysis** — Present and missing ATS keywords
- 💡 **Recommendations** — Specific, actionable improvement suggestions
- 🎤 **Interview Prep** — Categorized questions by difficulty
- 💬 **RAG Chat** — Ask anything, answers grounded in your documents
- 📊 **Dashboard** — Stats, recent analyses, skill overview
- 🔐 **Secure Authentication** — JWT + bcrypt

---

## 🏗 Architecture

```
React (Vite)
    ↓ REST API
FastAPI (Python)
    ↓
MongoDB Atlas
    ↓
RAG Pipeline
    ↓
MongoDB Atlas Vector Search
    ↓
Google Gemini API (gemini-1.5-flash + text-embedding-004)
```

**Security**: Gemini API key lives **only** on the backend. Never exposed to the frontend.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Axios, Recharts |
| Styling | Vanilla CSS (custom dark design system) |
| Backend | Python, FastAPI, Uvicorn, Pydantic v2 |
| Database | MongoDB Atlas, Motor (async) |
| Vector Search | MongoDB Atlas Vector Search |
| AI | Google Gemini API (google-generativeai SDK) |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Doc Parsing | pdfplumber, python-docx |
| Testing | pytest, pytest-asyncio, httpx |

---

## 📁 Project Structure

```
ai-job-resume-platform/
├── frontend/              # React + Vite frontend
│   └── src/
│       ├── pages/         # Route-level components
│       ├── components/    # Reusable UI components
│       ├── layouts/       # Page layouts
│       ├── services/      # API calls (axios)
│       ├── context/       # AuthContext
│       ├── hooks/         # Custom hooks
│       └── utils/         # Constants, formatters
│
└── backend/               # FastAPI backend
    └── app/
        ├── routes/        # API endpoints
        ├── services/      # Business logic
        ├── ai/            # Gemini client, embeddings, prompts, RAG
        ├── rag/           # Chunker, retriever, vector search
        ├── document_processing/  # PDF/DOCX/TXT parsers
        ├── models/        # MongoDB models
        ├── schemas/       # Pydantic schemas
        ├── middleware/    # Auth, error handling
        └── config/        # Settings, database
```

---

## 🚀 Installation

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB Atlas account
- Google Gemini API key

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-job-resume-platform
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
```

Edit `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true
DATABASE_NAME=ai_resume_platform
JWT_SECRET=your_super_secret_random_string_here
JWT_EXPIRE_MINUTES=60
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend Setup

```bash
cd frontend
npm install

# Copy environment
cp .env.example .env  # or create .env manually
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🗄 MongoDB Atlas Setup

1. Create a [MongoDB Atlas](https://cloud.mongodb.com) account
2. Create a free cluster
3. Create a database user and get connection string
4. Add your IP to the allowlist (or use `0.0.0.0/0` for development)
5. Add the connection string to `backend/.env`

### MongoDB Atlas Vector Search Index

Create a vector search index on the `document_chunks` collection.

In Atlas UI: **Search** → **Create Search Index** → **JSON Editor**:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {"type": "filter", "path": "user_id"},
    {"type": "filter", "path": "document_id"},
    {"type": "filter", "path": "document_type"}
  ]
}
```

**Index name:** `document_chunks_vector_index`

> ⚠️ Without this index, the app falls back to regular MongoDB queries (no semantic search). Set it up for full RAG capability.

---

## 🤖 Gemini API Setup

1. Go to [Google AI Studio](https://aistudio.google.com)
2. Create an API key
3. Add it to `backend/.env` as `GEMINI_API_KEY`

The app uses:
- `gemini-1.5-flash` for text generation
- `models/text-embedding-004` for embeddings (768 dimensions)

---

## ▶️ Running the Application

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Or:
```bash
python run.py
```

Backend available at: **http://localhost:8000**
Swagger docs: **http://localhost:8000/docs**

### Frontend

```bash
cd frontend
npm run dev
```

Frontend available at: **http://localhost:5173**

---

## 📡 API Documentation

Full interactive docs at `http://localhost:8000/docs`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/stats` | User statistics |

### Resumes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resumes/upload` | Upload resume (multipart) |
| GET | `/api/resumes` | List resumes |
| GET | `/api/resumes/{id}` | Get resume |
| DELETE | `/api/resumes/{id}` | Delete resume |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs` | List jobs |
| GET | `/api/jobs/{id}` | Get job |
| PUT | `/api/jobs/{id}` | Update job |
| DELETE | `/api/jobs/{id}` | Delete job |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis` | Run analysis |
| GET | `/api/analysis` | List analyses |
| GET | `/api/analysis/{id}` | Get analysis |
| GET | `/api/analysis/dashboard/stats` | Dashboard stats |

### Interview
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/interview/generate` | Generate questions |
| GET | `/api/interview` | List sessions |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Send message |
| GET | `/api/chat/conversations` | List conversations |
| GET | `/api/chat/conversations/{id}` | Get messages |

---

## 🧪 Testing

```bash
cd backend
source venv/bin/activate
pytest app/tests/ -v
```

---

## 📖 Documentation

- [`docs/architecture.md`](docs/architecture.md) — System architecture
- [`docs/rag.md`](docs/rag.md) — RAG pipeline explanation
- [`http://localhost:8000/docs`](http://localhost:8000/docs) — Live API docs

---

## 🔧 Key Design Decisions

1. **Real RAG** — Documents are chunked, embedded, and retrieved semantically. Not full-document prompts.
2. **Evidence-based Scoring** — Match score uses a weighted methodology (Skills 40%, Experience 25%, Projects 15%, Keywords 10%, Education 10%)
3. **Anti-hallucination** — System prompts explicitly forbid inventing information
4. **User Isolation** — All DB queries and vector searches filter by `user_id`
5. **Pydantic Validation** — All AI JSON responses are validated before storage
6. **Centralized Prompts** — All prompts in `app/ai/prompts.py`, not scattered in routes

---

## 🚀 Future Improvements

- [ ] Resume versioning
- [ ] Job application tracking
- [ ] PDF resume generator from recommendations
- [ ] Email notifications
- [ ] LinkedIn job import
- [ ] Multi-resume comparison
- [ ] Team/recruiter features
- [ ] Analytics dashboard with charts
- [ ] Mobile app (React Native)

---

## 📸 Screenshots

*Add screenshots after running the application*

---

## 👤 Author

Built as a portfolio project demonstrating production-quality full-stack AI engineering.
