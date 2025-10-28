import os
import sys

def validate_env():
    """Validate required environment variables"""
    required_vars = [
        "JWT_SECRET",
        "OPENAI_API_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        sys.exit(1)
    
    print(f"✅ All required environment variables are set")