# Architecture — AI Job & Resume Intelligence Platform

## System Overview

```
React (Frontend)
       ↓ HTTP/REST
FastAPI (Backend)
       ↓
MongoDB Atlas (Data Storage)
       ↓
RAG Pipeline
       ↓
MongoDB Atlas Vector Search
       ↓
Google Gemini AI
```

## Why Gemini is Accessed Only from the Backend

The Gemini API key is a sensitive credential that must never be exposed to the frontend.

If the key were in the React app:
- It would be visible in the browser's source/network tab
- Anyone visiting the site could extract and misuse the key
- API costs could be abused

The architecture enforces: `React → FastAPI → Gemini`. The key lives only in `backend/.env` and is loaded server-side via pydantic-settings. The frontend never receives or sees the key.

## Component Architecture

### Frontend (React + Vite)
- **Pages**: Top-level route components
- **Layouts**: DashboardLayout (sidebar + topbar), AuthLayout
- **Components**: Reusable UI components (cards, buttons, inputs, chat)
- **Hooks**: Custom React hooks (useAuth)
- **Services**: Axios-based API calls (`authService`, `resumeService`, etc.)
- **Context**: AuthContext for global authentication state

### Backend (FastAPI)
- **Routes**: Thin route handlers (no business logic)
- **Services**: Business logic layer
- **AI Layer**: Gemini client, embeddings, prompts, RAG pipeline
- **RAG Layer**: Chunker, vector search, retriever, context builder
- **Document Processing**: PDF/DOCX/TXT parsers
- **Middleware**: JWT auth, error handlers
- **Utils**: Security, file validation, response formatting

### Database (MongoDB Atlas)
Collections:
- `users` — account data (hashed passwords)
- `resumes` — resume metadata and parsed content
- `jobs` — job descriptions
- `document_chunks` — chunked text with embeddings
- `analyses` — analysis results
- `interviews` — generated interview questions
- `conversations` — chat conversations
- `messages` — chat messages

## Security Architecture

1. **Password Storage**: bcrypt hashing via passlib — plaintext passwords never stored
2. **Authentication**: JWT tokens (HS256) with configurable expiry
3. **API Key Security**: Gemini key only in backend .env, never in frontend
4. **User Isolation**: Every database query filtered by `user_id` — users cannot access each other's data
5. **Vector Search Security**: RAG retrieval also filtered by `user_id` — cross-user data retrieval is impossible
6. **Input Validation**: Pydantic models validate all inputs
7. **AI Output Validation**: Pydantic validates Gemini JSON responses before storage
8. **Error Handling**: Stack traces never exposed to users
