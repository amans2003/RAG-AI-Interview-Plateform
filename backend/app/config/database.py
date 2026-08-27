"""
MongoDB async connection using Motor.
Provides database access throughout the application.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

# Global MongoDB client
_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
    return _client


def get_database():
    return get_client()[settings.database_name]


async def connect_to_mongo():
    """Initialize MongoDB connection and create indexes."""
    global _client
    try:
        _client = AsyncIOMotorClient(settings.mongodb_uri)
        # Verify connection
        await _client.admin.command("ping")
        logger.info("✅ Connected to MongoDB Atlas")
        await create_indexes()
    except Exception as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection."""
    global _client
    if _client:
        _client.close()
        _client = None
        logger.info("MongoDB connection closed")


async def create_indexes():
    """Create MongoDB indexes for performance and data integrity."""
    db = get_database()
    try:
        # Users
        await db.users.create_index("email", unique=True)

        # Resumes
        await db.resumes.create_index("user_id")
        await db.resumes.create_index("created_at")

        # Jobs
        await db.jobs.create_index("user_id")
        await db.jobs.create_index("created_at")

        # Analyses
        await db.analyses.create_index([("user_id", ASCENDING)])
        await db.analyses.create_index([("resume_id", ASCENDING)])
        await db.analyses.create_index([("job_id", ASCENDING)])
        await db.analyses.create_index("created_at")

        # Conversations
        await db.conversations.create_index("user_id")
        await db.conversations.create_index("created_at")

        # Messages
        await db.messages.create_index("conversation_id")
        await db.messages.create_index("created_at")

        # Document chunks
        await db.document_chunks.create_index("user_id")
        await db.document_chunks.create_index("document_id")
        await db.document_chunks.create_index([("user_id", ASCENDING), ("document_id", ASCENDING)])
        await db.document_chunks.create_index("document_type")

        # Interview questions
        await db.interviews.create_index("user_id")
        await db.interviews.create_index("analysis_id")

        logger.info("✅ MongoDB indexes created")
    except Exception as e:
        logger.warning(f"Index creation warning: {e}")
