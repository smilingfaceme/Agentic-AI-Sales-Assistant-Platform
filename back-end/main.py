from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routes
from routes import auth, dashboard, project, conversation, chat, knowledge, whatsapp, qa
from middleware.error_handler import add_exception_handlers
from utils.validate_env import validate_env

app = FastAPI(
    title="Bot Admin Backend",
    version="1.0.0",
    description="FastAPI backend for bot administration"
)

# Validate environment variables
validate_env()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(project.router, prefix="/api/project", tags=["project"])
app.include_router(conversation.router, prefix="/api/conversation", tags=["conversation"])
app.include_router(chat.router, prefix="/api/chats", tags=["chats"])
app.include_router(knowledge.router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(whatsapp.router, prefix="/api/whatsapp", tags=["whatsapp"])
app.include_router(qa.router, prefix="/api/qa", tags=["question-answer"])

# Add exception handlers
add_exception_handlers(app)

@app.get("/")
def read_root():
    return {"message": "FastAPI Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("NODE_ENV") == "development"
    )