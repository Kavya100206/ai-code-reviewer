# AI Code Review Bot

An automated code review system that analyzes GitHub pull requests using AI and provides intelligent feedback directly on the PR. Built with Node.js, this production-ready backend system uses event-driven architecture to process code reviews asynchronously.

## Overview

This application automatically reviews code changes in GitHub pull requests, identifying potential bugs, security vulnerabilities, performance issues, and code quality concerns. When a developer opens a pull request, the system:

1. Receives a webhook event from GitHub
2. Validates the request and enqueues a review job
3. Fetches the PR code and changed files
4. Analyzes the code using AI (Groq Llama 3.3)
5. Posts detailed feedback as a comment on the GitHub PR

The entire process takes approximately 10-20 seconds from PR creation to review posting.

## Features

- **Automated PR Analysis**: Instant code review on every pull request
- **AI-Powered Insights**: Identifies bugs, security issues, performance problems, and best practices
- **Async Processing**: Non-blocking webhook response with background job processing
- **Structured Feedback**: Categorized issues with severity levels and actionable suggestions
- **Production Ready**: Comprehensive error handling, logging, retry logic, and health monitoring
- **Secure**: HMAC signature verification for webhook security

## Architecture

```
GitHub PR Event → Webhook Endpoint → Signature Verification → Save to PostgreSQL
                                                                        ↓
Developer Sees Review ← Post Comment ← Format Markdown ← Store Review ← Job Queue (Redis)
                                                                        ↓
                                                            Worker Process
                                                                        ↓
                                                            Fetch PR Code (GitHub API)
                                                                        ↓
                                                            AI Analysis (Groq)
```

The system uses an event-driven architecture with separate server and worker processes:

- **Server Process**: Handles incoming webhooks, validates requests, and enqueues jobs
- **Worker Process**: Processes jobs asynchronously, fetches code, runs AI analysis, and posts reviews
- **Database**: PostgreSQL stores repositories, pull requests, review jobs, and review results
- **Queue**: Redis-based job queue (BullMQ) manages async processing with retry logic

## Tech Stack

**Backend Framework**
- Node.js v18+
- Express.js (REST API server)

**Database & Queue**
- PostgreSQL (NeonDB for managed hosting)
- Redis (Upstash for managed hosting)
- BullMQ (job queue with retry logic)

**AI & Integrations**
- Groq API (Llama 3.3 70B model)
- GitHub REST API (Octokit SDK)
- GitHub App authentication

**Infrastructure**
- Winston (structured logging)
- dotenv (environment management)
- HMAC SHA-256 (webhook security)

## Prerequisites

Before setting up the project, ensure you have:

- Node.js v18 or higher
- npm or yarn package manager
- GitHub account
- NeonDB account (PostgreSQL hosting)
- Upstash account (Redis hosting)
- Groq API account (free tier available)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-code-reviewer.git
cd ai-code-reviewer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up GitHub App

Create a GitHub App for webhook integration:

1. Go to GitHub Settings > Developer settings > GitHub Apps
2. Click "New GitHub App"
3. Configure the app:
   - **Name**: AI Code Review Bot
   - **Webhook URL**: Your server URL (will update after deployment)
   - **Webhook Secret**: Generate a random secret
   - **Permissions**:
     - Pull requests: Read & Write
     - Contents: Read-only
     - Issues: Read & Write (for posting comments)
   - **Subscribe to events**: Pull request
4. Generate and download the private key (.pem file)
5. Install the app on your repository
6. Note down: App ID, Installation ID

Detailed guide: See `docs/GITHUB-APP.md`

### 4. Set Up NeonDB (PostgreSQL)

1. Create a NeonDB account at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Run migrations to create tables:

```bash
node database/migrate.js
```

Detailed guide: See `docs/DATABASE.md`

### 5. Set Up Upstash (Redis)

1. Create an Upstash account at https://upstash.com
2. Create a new Redis database
3. Copy the connection details (URL, token)

Detailed guide: See `docs/REDIS-SETUP.md`

### 6. Get Groq API Key

1. Sign up at https://console.groq.com
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `gsk_`)

### 7. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (NeonDB PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# GitHub App Configuration
GITHUB_APP_ID=your_app_id
GITHUB_INSTALLATION_ID=your_installation_id
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_PRIVATE_KEY_PATH=./github-app-key.pem

# Upstash Redis
REDIS_URL=your_redis_url
REDIS_TOKEN=your_redis_token

# Groq AI
GROQ_API_KEY=your_groq_api_key

```

Place your GitHub App private key file in the project root and update the path in `.env`.

## Running the Application

The application requires two processes to run simultaneously:

### Terminal 1: Start the Server

```bash
npm run dev
```

This starts the Express server on port 3000 (or your configured PORT). The server handles:
- Webhook endpoints at `/webhook/github`
- Health check at `/health`
- Readiness check at `/ready`

### Terminal 2: Start the Worker

```bash
npm run worker
```

This starts the background worker process that:
- Polls the Redis queue for new jobs
- Processes code review requests
- Fetches PR data from GitHub
- Runs AI analysis
- Posts review comments

### Verify Setup

Check that everything is running:

```bash
# In another terminal
node src/check-data.js    # Verify database connection
node src/check-queue.js   # Verify Redis queue
```

Visit `http://localhost:3000/health` to see system status.

## Project Structure

```
ai-code-reviewer/
├── src/
│   ├── config/              # Configuration modules
│   │   ├── database.js      # PostgreSQL connection
│   │   ├── github.js        # GitHub App authentication
│   │   └── queue.js         # BullMQ queue setup
│   ├── routes/              # Express routes
│   │   ├── webhook.js       # GitHub webhook handler
│   │   └── health.js        # Health check endpoints
│   ├── services/            # Business logic
│   │   └── ai-review.js     # AI code review service
│   ├── utils/               # Utility functions
│   │   ├── github-api.js    # GitHub API helpers
│   │   ├── webhook.js       # Webhook security
│   │   ├── format-review.js # Markdown formatter
│   │   └── logger.js        # Winston logger
│   ├── index.js             # Server entry point
│   ├── worker.js            # Background worker
│   ├── check-data.js        # Database utility
│   └── check-queue.js       # Queue utility
├── database/
│   ├── schema.sql           # Database schema
│   ├── migrate.js           # Migration script
│   └── seed.sql             # Sample data (optional)
├── docs/                    # Documentation
│   ├── DATABASE.md          # Database setup guide
│   ├── GITHUB-APP.md        # GitHub App configuration
│   ├── REDIS-SETUP.md       # Redis setup guide
│   └── SETUP.md             # Detailed setup instructions
├── logs/                    # Application logs (gitignored)
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
└── package.json             # Dependencies and scripts
```

## API Endpoints

### Webhook Endpoint

**POST** `/webhook/github`
- Receives GitHub pull request events
- Validates HMAC signature
- Enqueues review jobs
- Returns 200 OK within 1 second

### Health Endpoints

**GET** `/health`
- Returns overall system health status
- Checks database connectivity
- Response: `{ status: "ok", timestamp: "...", services: {...} }`

**GET** `/ready`
- Readiness check for deployment platforms
- Response: `{ ready: true }`

## Monitoring

The application provides several monitoring capabilities:

**Logging**
- Console output with colored formatting
- File-based logging in `logs/` directory
  - `logs/error.log` - Error level logs
  - `logs/combined.log` - All logs
- Automatic log rotation (5MB max size, 5 files retained)

**Health Checks**
- `/health` endpoint for service monitoring
- Database connectivity checks
- Queue status verification

**Job Tracking**
- All jobs tracked in `review_jobs` table
- Status: pending, processing, completed, failed
- Retry attempts logged
- Completion timestamps

## Documentation

For detailed setup and configuration guides:

- [Database Setup](docs/DATABASE.md) - PostgreSQL schema and migrations
- [GitHub App Configuration](docs/GITHUB-APP.md) - Creating and configuring GitHub App
- [Redis Setup](docs/REDIS-SETUP.md) - Upstash Redis configuration
- [Project Setup](docs/SETUP.md) - Complete setup walkthrough

