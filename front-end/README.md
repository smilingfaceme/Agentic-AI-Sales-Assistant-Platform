# Bot Admin Panel - Frontend

A modern WhatsApp Bot Admin Panel built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Features](#features)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.18.0 or higher (20.0.0+ recommended)
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: For version control

You can verify your installations by running:

```bash
node --version
npm --version
```

## 🚀 Tech Stack

- **Framework**: [Next.js 15.5.3](https://nextjs.org/) with Turbopack
- **UI Library**: [React 19.1.0](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4.1.13](https://tailwindcss.com/)
- **Icons**: [React Icons 5.5.0](https://react-icons.github.io/react-icons/)
- **Charts**: [Recharts 3.3.0](https://recharts.org/)
- **File Processing**: XLSX, Papa Parse
- **PDF Generation**: jsPDF, html2canvas
- **QR Code**: qrcode, qrcode-terminal

## 🏁 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Bot_Admin_Panel
```

### 2. Navigate to Frontend Directory

```bash
cd front-end
```

### 3. Install Dependencies

```bash
npm install
```

This will install all required dependencies listed in `package.json`.

### 4. Set Up Environment Variables

Create a `.env.local` file in the `front-end` directory:

```bash
# Create .env.local file
touch .env.local
```

Add the following environment variable:

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000/api
```

**Note**: Replace `http://localhost:8000/api` with your actual backend API URL.

### 5. Run the Development Server

```bash
npm run dev
```

The application will start on [http://localhost:3000](http://localhost:3000).

Open your browser and navigate to the URL to see the application running.

## 🔐 Environment Variables

The application requires the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | Backend API base URL | `http://localhost:8000/api` |

**Important**:
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Never commit `.env.local` or `.env` files to version control
- For production, set these variables in your hosting platform

## 📜 Available Scripts

In the `front-end` directory, you can run:

### `npm run dev`

Runs the app in development mode with Turbopack on port 3000.
- Hot reload enabled
- Fast refresh for instant updates
- Open [http://localhost:3000](http://localhost:3000) to view

### `npm run build`

Builds the application for production with Turbopack.
- Optimizes the build for best performance
- Minifies code and optimizes assets
- Generates static files in `.next` directory

### `npm run start`

Starts the production server on port 3000.
- Must run `npm run build` first
- Serves the optimized production build

### `npm run lint`

Runs ESLint to check code quality.
- Checks for code style issues
- Identifies potential bugs
- Enforces best practices

## 📁 Project Structure

```
front-end/
├── public/              # Static files
├── src/
│   ├── app/            # Next.js app directory (routes)
│   │   ├── auth/       # Authentication pages
│   │   ├── dashboard/  # Dashboard pages
│   │   ├── layout.tsx  # Root layout
│   │   └── page.tsx    # Home page
│   ├── components/     # React components
│   │   └── Dashboard/  # Dashboard-specific components
│   ├── contexts/       # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API service functions
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── .env.local          # Environment variables (create this)
├── next.config.ts      # Next.js configuration
├── package.json        # Dependencies and scripts
├── tailwind.config.ts  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## ✨ Features

- **Authentication**: Login, Register, Password Reset
- **Dashboard**: Analytics and KPI tracking
- **Chat Management**: WhatsApp chat interface
- **Bot Configuration**: Chatbot settings and workflows
- **Knowledge Base**: File upload and management
- **Image Management**: Image upload with matching
- **Team Management**: User roles and permissions
- **Integration**: WhatsApp Business API integration
- **Sustainability KPIs**: Environmental metrics tracking
- **Export**: PDF and Excel export functionality

## 🛠️ Development

### Code Style

The project uses:
- **ESLint**: For code linting
- **TypeScript**: For type safety
- **Prettier**: Recommended for code formatting

### Path Aliases

The project uses TypeScript path aliases:

```typescript
import Component from '@/components/Component'
import { apiRequest } from '@/utils'
```

`@/` maps to the `src/` directory.

## 🏗️ Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm run start
   ```

3. **Deploy**: The `.next` folder contains the production build. Deploy to:
   - Vercel (recommended)
   - Netlify
   - AWS
   - Any Node.js hosting platform

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Kill the process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- -p 3001
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Environment Variables Not Working

- Ensure `.env.local` is in the `front-end` directory
- Restart the development server after changing environment variables
- Variables must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser

## 📞 Support

For issues and questions:
- Check the [Next.js Documentation](https://nextjs.org/docs)
- Review the project's issue tracker
- Contact the development team

## 📄 License

This project is private and proprietary.