# Bot Admin Panel - Backend

FastAPI-based backend for bot administration with PostgreSQL database, ChromaDB vector storage, and OpenAI integration.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Database Migrations](#database-migrations)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Python 3.10+** - [Download Python](https://www.python.org/downloads/)
- **PostgreSQL 12+** - [Download PostgreSQL](https://www.postgresql.org/download/)
- **pip** - Python package manager (comes with Python)
- **Git** - Version control system

## 🛠 Technology Stack

- **FastAPI** - Modern web framework for building APIs
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migration tool
- **ChromaDB** - Vector database for embeddings
- **OpenAI API** - AI/ML capabilities
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **JWT** - Authentication

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Bot_Admin_Panel
```

### 2. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
cd back-end
pip install -r requirements.txt
```

## ⚙️ Configuration

### 1. Create Environment File

Copy the example environment file and configure it:

```bash
cp back-end/.env.example back-end/.env
```

### 2. Configure Environment Variables

Edit the `back-end/.env` file with your settings:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Database Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here
POSTGRES_DB=bot_admin_panel

# Authentication
JWT_SECRET=your_secret_key_here

# OpenAI Configuration
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your_openai_api_key_here

# WhatsApp Configuration (Optional)
WhatsApp_Bot_URL=http://localhost:4000
```

### 3. Required Environment Variables

The following environment variables are **required**:
- `JWT_SECRET` - Secret key for JWT token generation
- `OPENAI_API_KEY` - Your OpenAI API key

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bot_admin_panel;

# Exit psql
\q
```

### 2. Run Database Migrations

The application uses Alembic for database migrations. Migrations will run automatically when you start the application for the first time.

To manually run migrations:

```bash
cd back-end
alembic upgrade head
```

### 3. Verify Database Setup

Check that all tables were created:

```bash
psql -U postgres -d bot_admin_panel -c "\dt public.*"
```

Expected tables in `public` schema:
- `roles`
- `companies`
- `users`
- `invitations`
- `integrations`
- `bot_personality`
- `alembic_version`

## 🚀 Running the Application

### Development Mode

```bash
cd back-end
python main.py
```

The server will start at `http://localhost:5000` (or the port specified in your `.env` file).

### Production Mode

```bash
cd back-end
uvicorn main:app --host 0.0.0.0 --port 5000
```

### With Auto-Reload (Development)

Set `NODE_ENV=development` in your `.env` file, then:

```bash
python main.py
```

## 📚 API Documentation

Once the application is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status": "healthy"}
```


## 📁 Project Structure

```
back-end/
├── alembic/                    # Database migration files
│   ├── versions/              # Migration version files
│   └── env.py                 # Alembic environment configuration
├── db/                        # Database modules
│   ├── models.py             # SQLAlchemy ORM models
│   ├── db_connection.py      # Database connection setup
│   ├── init_db.py            # Database initialization
│   ├── company_table.py      # Company-specific table operations
│   └── public_table.py       # Public schema table operations
├── middleware/                # Custom middleware
│   ├── auth.py               # Authentication middleware
│   └── error_handler.py      # Global error handling
├── routers/                   # API route handlers
│   ├── auth.py               # Authentication endpoints
│   ├── user.py               # User management
│   ├── company.py            # Company management
│   ├── knowledge.py          # Knowledge base management
│   ├── chat.py               # Chat functionality
│   ├── conversation.py       # Conversation management
│   ├── integration.py        # Third-party integrations
│   ├── workflow.py           # Workflow management
│   └── ...                   # Other route modules
├── src/                       # Core business logic
│   ├── vectorize.py          # Text vectorization
│   ├── image_vectorize.py    # Image vectorization
│   ├── fileparser.py         # File parsing utilities
│   └── service_client.py     # External service clients
├── utils/                     # Utility functions
│   ├── validate_env.py       # Environment validation
│   ├── token_handler.py      # JWT token handling
│   ├── send_email_without_smtp.py  # Email utilities
│   └── ...                   # Other utilities
├── files/                     # File storage
│   ├── images/               # Uploaded images
│   └── knowledges/           # Knowledge base files
├── chroma_data/              # ChromaDB vector storage
├── logs/                      # Application logs
├── main.py                    # Application entry point
├── requirements.txt           # Python dependencies
├── alembic.ini               # Alembic configuration
└── .env                      # Environment variables (create from .env.example)
```

## 🔄 Database Migrations

### Creating a New Migration

When you modify database models, create a new migration:

```bash
cd back-end
alembic revision --autogenerate -m "Description of changes"
```

### Applying Migrations

```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade to specific version
alembic upgrade <revision_id>

# Downgrade one version
alembic downgrade -1

# Downgrade to specific version
alembic downgrade <revision_id>
```

### Viewing Migration History

```bash
# Show current version
alembic current

# Show migration history
alembic history

# Show pending migrations
alembic heads
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `could not connect to server: Connection refused`

**Solution**:
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify PostgreSQL is listening on the correct port

```bash
# Check PostgreSQL status (Linux/Mac)
sudo systemctl status postgresql

# Check PostgreSQL status (Windows)
# Open Services and look for PostgreSQL service
```

#### 2. Missing Environment Variables

**Error**: `❌ Missing required environment variables: JWT_SECRET, OPENAI_API_KEY`

**Solution**:
- Copy `.env.example` to `.env`
- Fill in all required environment variables
- Restart the application

#### 3. Migration Errors

**Error**: `Target database is not up to date`

**Solution**:
```bash
cd back-end
alembic upgrade head
```

#### 4. Port Already in Use

**Error**: `[Errno 48] Address already in use`

**Solution**:
- Change the `PORT` in `.env` file
- Or kill the process using the port:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

#### 5. ChromaDB Initialization Error

**Solution**:
- Ensure `chroma_data` directory exists
- Check write permissions
- Delete `chroma_data` and restart (will recreate)

#### 6. OpenAI API Errors

**Error**: `Invalid API key` or `Rate limit exceeded`

**Solution**:
- Verify your OpenAI API key in `.env`
- Check your OpenAI account billing and usage limits
- Ensure the API key has proper permissions

### Logs

Application logs are stored in:
- `back-end/logs/` - General application logs
- Console output - Real-time logs during development

## 📝 Development Notes

### Code Style
- Follow PEP 8 guidelines
- Use type hints where possible
- Document functions with docstrings

### Database Changes
- Always use Alembic migrations for schema changes
- Never modify the database schema directly
- Test migrations in development before applying to production

### Security
- Never commit `.env` file to version control
- Keep API keys and secrets secure
- Use environment variables for sensitive data
- Regularly update dependencies for security patches

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Create a pull request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Contact the development team

---

**Last Updated**: 2025-11-20