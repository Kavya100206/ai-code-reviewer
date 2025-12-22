# 🤖 AI Code Review Bot

An event-driven, production-grade backend system that automatically reviews GitHub pull requests using AI.

## 🚀 Features

- **Automated PR Reviews**: AI-powered code analysis on every pull request
- **Event-Driven Architecture**: Webhook-based automation with async job processing
- **Smart Feedback**: Categorized reviews (bugs, security, performance, best practices)
- **Production-Ready**: Error handling, logging, retry logic, and monitoring

## 🏗️ Architecture

```
GitHub PR Event → Webhook → Validate → Enqueue Job → Worker
                                                        ↓
                                              Fetch Code → AI Analysis
                                                        ↓
                                              Post Review to GitHub
```

## 📋 Prerequisites

- Node.js v18+
- NeonDB account (PostgreSQL)
- GitHub account
- OpenAI API key

## 🛠️ Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (NeonDB)
- **Queue**: BullMQ + Redis
- **AI**: OpenAI GPT-4
- **Integrations**: GitHub REST API + Webhooks

## 📦 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-code-reviewer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run the application
npm run dev
```

## 📚 Documentation

- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [API Documentation](docs/API.md)

## 🧪 Testing

```bash
npm test
```

## 📝 License

MIT

---

**Built with ❤️ as a learning project**
