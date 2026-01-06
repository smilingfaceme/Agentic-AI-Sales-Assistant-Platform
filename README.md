# Agentic-AI-Sales-Assistant-Platform

A comprehensive WhatsApp Bot Administration Platform with AI-powered chatbot capabilities, knowledge base management, workflow automation, and sustainability KPI tracking.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

Bot Admin Panel is a full-stack application designed to manage and configure WhatsApp chatbots with advanced AI capabilities. The platform provides a modern, intuitive interface for managing bot personalities, knowledge bases, conversations, workflows, and integrations with WhatsApp Business API.

### Key Capabilities

- **AI-Powered Chatbot**: Leverages OpenAI for intelligent conversation handling
- **Knowledge Management**: Upload and manage documents with vector-based search using ChromaDB
- **Workflow Automation**: Visual workflow editor with Zapier/Make-style interface
- **Multi-Tenancy**: Company-based user management with role-based access control
- **WhatsApp Integration**: Direct integration with WhatsApp Business API
- **Analytics Dashboard**: Real-time KPI tracking and sustainability metrics
- **Image Matching**: AI-powered image recognition and matching capabilities

## ✨ Features

### Frontend Features

- 🔐 **Authentication System**
  - User login and registration
  - Password reset functionality
  - JWT-based authentication
  - Role-based access control

- 📊 **Dashboard**
  - Real-time analytics and KPIs
  - Conversation metrics
  - User activity tracking
  - Sustainability metrics visualization

- 💬 **Chat Management**
  - WhatsApp chat interface
  - Real-time message handling
  - Conversation history
  - Multi-user chat support

- 🤖 **Bot Configuration**
  - Customizable bot personality
  - Response templates
  - Behavior settings
  - Integration management

- 📚 **Knowledge Base**
  - File upload (PDF, DOCX, TXT, CSV, XLSX)
  - Document management
  - Vector-based search
  - Content organization

- 🖼️ **Image Management**
  - Image upload and storage
  - AI-powered image matching
  - Gallery management

- 👥 **Team Management**
  - User invitation system
  - Role assignment
  - Permission management
  - Company management

- 🔄 **Workflow Editor**
  - Visual workflow builder
  - Drag-and-drop interface
  - Trigger and action configuration
  - Conditional logic support

- 🌱 **Sustainability KPIs**
  - Environmental metrics tracking
  - Carbon footprint monitoring
  - Sustainability reporting
  - Data visualization

- 📤 **Export Functionality**
  - PDF export
  - Excel export
  - Data visualization export

### Backend Features

- 🔒 **Secure Authentication**
  - JWT token-based auth
  - Password hashing with bcrypt
  - Email verification
  - Password reset via email

- 🗄️ **Database Management**
  - PostgreSQL for relational data
  - ChromaDB for vector embeddings
  - Alembic migrations
  - Multi-schema support

- 🤖 **AI Integration**
  - OpenAI API integration
  - Text embeddings generation
  - Image vectorization
  - Semantic search

- 📁 **File Processing**
  - Multiple file format support
  - Text extraction
  - Document parsing
  - File storage management

- 🔌 **API Endpoints**
  - RESTful API design
  - Comprehensive route coverage
  - Error handling middleware
  - CORS configuration

- 📧 **Email Services**
  - Invitation emails
  - Password reset emails
  - Notification system

## 🛠 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.3 | React framework with SSR |
| React | 19.1.0 | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| Tailwind CSS | 4.1.13 | Utility-first CSS framework |
| React Icons | 5.5.0 | Icon library |
| Recharts | 3.3.0 | Data visualization |
| jsPDF | 3.0.3 | PDF generation |
| XLSX | 0.18.5 | Excel file handling |
| QRCode | 1.5.4 | QR code generation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.120.0 | Modern Python web framework |
| Python | 3.10+ | Programming language |
| PostgreSQL | 12+ | Relational database |
| SQLAlchemy | 2.0.44 | ORM |
| Alembic | 1.17.0 | Database migrations |
| ChromaDB | 1.2.2 | Vector database |
| OpenAI | 2.6.1 | AI/ML capabilities |
| Uvicorn | 0.38.0 | ASGI server |
| Pydantic | 2.12.3 | Data validation |
| LangChain | 1.0.2 | LLM framework |

## 📁 Project Structure

```
Bot_Admin_Panel/
├── front-end/                 # Next.js frontend application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── app/             # Next.js app directory (routes)
│   │   │   ├── auth/        # Authentication pages
│   │   │   ├── dashboard/   # Dashboard pages
│   │   │   │   ├── chatbot/ # Bot configuration
│   │   │   │   ├── chats/   # Chat interface
│   │   │   │   ├── go-live/ # Integration setup
│   │   │   │   ├── settings/# Settings pages
│   │   │   │   ├── sustainability/ # KPI tracking
│   │   │   │   └── workflow/# Workflow editor
│   │   │   └── ...
│   │   ├── components/      # React components
│   │   ├── contexts/        # React Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service functions
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── README.md
│
├── back-end/                 # FastAPI backend application
│   ├── alembic/             # Database migrations
│   ├── db/                  # Database models and init
│   ├── middleware/          # Custom middleware
│   ├── routers/             # API route handlers
│   │   ├── auth.py         # Authentication
│   │   ├── user.py         # User management
│   │   ├── company.py      # Company management
│   │   ├── knowledge.py    # Knowledge base
│   │   ├── chat.py         # Chat functionality
│   │   ├── workflow.py     # Workflow management
│   │   └── ...
│   ├── src/                 # Core business logic
│   ├── utils/               # Utility functions
│   ├── files/               # File storage
│   ├── chroma_data/         # Vector database storage
│   ├── main.py              # Application entry point
│   ├── requirements.txt
│   └── README.md
│
└── README.md                 # This file
```

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

### For Frontend
- **Node.js**: Version 18.18.0 or higher (20.0.0+ recommended)
- **npm**: Version 9.0.0 or higher

### For Backend
- **Python**: Version 3.10 or higher
- **PostgreSQL**: Version 12 or higher
- **pip**: Python package manager

### General
- **Git**: For version control

Verify your installations:

```bash
# Check Node.js and npm
node --version
npm --version

# Check Python
python --version  # or python3 --version

# Check PostgreSQL
psql --version
```

## 📦 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Bot_Admin_Panel
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd back-end

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Setup PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE bot_admin_panel;

# Create user (optional)
CREATE USER bot_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE bot_admin_panel TO bot_admin;

# Exit
\q
```

### 3. Frontend Setup

```bash
cd front-end

# Install dependencies
npm install
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `back-end` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/bot_admin_panel

# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# WhatsApp Configuration (optional)
WHATSAPP_API_KEY=your-whatsapp-api-key
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
```

### Frontend Configuration

Create a `.env.local` file in the `front-end` directory:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

## 🚀 Running the Application

### Start Backend Server

```bash
cd back-end

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Run migrations (first time only)
alembic upgrade head

# Start server
python main.py
```

The backend will be available at `http://localhost:8000`

### Start Frontend Development Server

```bash
cd front-end

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### Access the Application

1. Open your browser and navigate to `http://localhost:3000`
2. Register a new account or login
3. Start configuring your chatbot!

## 📚 API Documentation

Once the backend is running, you can access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Main API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | User login |
| `/auth/refresh` | POST | Refresh access token |
| `/user/profile` | GET | Get user profile |
| `/company/*` | * | Company management |
| `/knowledge/*` | * | Knowledge base operations |
| `/chat/*` | * | Chat functionality |
| `/conversation/*` | * | Conversation management |
| `/workflow/*` | * | Workflow operations |
| `/integration/*` | * | Integration management |
| `/personality/*` | * | Bot personality settings |
| `/sustainability/*` | * | Sustainability KPIs |

## 🏗️ Building for Production

### Backend Production Build

```bash
cd back-end

# Set environment to production
# In .env file: NODE_ENV=production

# Run with production settings
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Production Build

```bash
cd front-end

# Build the application
npm run build

# Start production server
npm run start
```

## 🚢 Deployment

### Frontend Deployment Options

- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Docker**

### Backend Deployment Options

- **AWS EC2**
- **Google Cloud Platform**
- **Heroku**
- **Docker + Kubernetes**
- **DigitalOcean**

### Environment Variables

Make sure to set all required environment variables in your deployment platform:

**Frontend:**
- `NEXT_PUBLIC_API_BASE`

**Backend:**
- `DATABASE_URL`
- `SECRET_KEY`
- `OPENAI_API_KEY`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- All other configuration variables

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, please contact the development team or open an issue in the repository.

---

**Built with ❤️ using Next.js, FastAPI, and AI**
