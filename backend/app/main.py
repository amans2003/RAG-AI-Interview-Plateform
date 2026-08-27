"""
FastAPI main application.
Registers all routes, middleware, and lifecycle events.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging

from app.config.settings import settings
from app.config.database import connect_to_mongo, close_mongo_connection
from app.middleware.error_handler import (
    validation_exception_handler,
    http_exception_handler,
    general_exception_handler,
)
from app.routes import auth, resumes, jobs, analysis, interview, chat

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Job & Resume Intelligence Platform",
        description="""
        A production-quality platform for AI-powered resume analysis, job matching,
        skill gap identification, interview preparation, and RAG-based AI chat.
        
        **Architecture:** React → FastAPI → MongoDB Atlas → Gemini AI
        
        **Security:** The Gemini API key is never exposed to the frontend.
        """,
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # CORS — allow frontend origin
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.frontend_url,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Exception handlers
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)

    # Lifecycle events
    @app.on_event("startup")
    async def startup():
        logger.info("🚀 Starting AI Job & Resume Platform API...")
        await connect_to_mongo()
        logger.info("✅ Application started successfully")

    @app.on_event("shutdown")
    async def shutdown():
        await close_mongo_connection()
        logger.info("👋 Application shut down")

    # Register all routers
    app.include_router(auth.router)
    app.include_router(resumes.router)
    app.include_router(jobs.router)
    app.include_router(analysis.router)
    app.include_router(interview.router)
    app.include_router(chat.router)

    @app.get("/", tags=["Health"])
    async def root():
        return {
            "message": "AI Job & Resume Intelligence Platform API",
            "version": "1.0.0",
            "docs": "/docs",
            "status": "running",
        }

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "healthy", "service": "ai-resume-platform"}

    return app


app = create_app()
