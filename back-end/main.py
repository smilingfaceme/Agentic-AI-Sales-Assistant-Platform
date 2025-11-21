from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routes
from routers import auth, user, company, invite, knowledge, conversation, chat, integration, image, chatbot_setting, extra, workflow, sustain_kpi, waca
from middleware.error_handler import add_exception_handlers
from utils.validate_env import validate_env
from db.init_db import initialize_database

app = FastAPI(
    title="Bot Admin Backend",
    version="1.0.0",
    description="FastAPI backend for bot administration",
    redirect_slashes=False
)

# Validate environment variables
validate_env()

# Initialize database (create tables if they don't exist)
initialize_database()

# CORS configuration - Allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
os.makedirs("files", exist_ok=True)
app.mount("/files", StaticFiles(directory="files"), name="files")
# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(company.router, prefix="/company", tags=["company"])
app.include_router(invite.router, prefix="/invite", tags=["invite"])
app.include_router(knowledge.router, prefix="/knowledge", tags=["knowledge"])
app.include_router(image.router, prefix="/image", tags=["image"])
app.include_router(conversation.router, prefix="/conversation", tags=["conversation"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(integration.router, prefix="/integration", tags=["integration"])
app.include_router(chatbot_setting.router, prefix="/personality", tags=["personality"])
app.include_router(extra.router, prefix="/document", tags=["document"])
app.include_router(workflow.router, prefix="/workflow", tags=["workflow"])
app.include_router(sustain_kpi.router, prefix="/sustainability", tags=["sustainability"])
app.include_router(waca.router, prefix="/waca", tags=["waca"])

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
        port=port,
        reload=os.getenv("NODE_ENV") == "development"
    )