# 📘 Setup Guide - Task 1

## What We Just Built

In Task 1, we created the foundation of our project:

### 📁 Project Structure
```
ai-code-reviewer/
├── src/
│   ├── config/
│   │   └── database.js      # Database connection and pooling
│   ├── index.js             # Main server entry point
│   └── test-db.js           # Database connection test
├── docs/
│   └── SETUP.md             # This file
├── .env.example             # Environment template
├── .gitignore               # Git exclusions
├── package.json             # Dependencies
└── README.md                # Project documentation
```

### 🔧 What Each File Does

#### **package.json**
- Defines project metadata and dependencies
- `"type": "module"` enables ES6 imports
- **Dependencies:**
  - `express`: Web server framework
  - `pg`: PostgreSQL client for NeonDB
  - `dotenv`: Load environment variables from .env

#### **src/index.js**
- Main application entry point
- Creates Express server
- Defines health check endpoints
- Loads environment configuration

#### **src/config/database.js**
- Manages PostgreSQL connection pool
- Exports `testConnection()` and `query()` functions
- Handles SSL for NeonDB
- Includes error handling and logging

#### **.env.example**
- Template showing required environment variables
- Copy this to `.env` and fill in your credentials
- Never commit `.env` to Git

#### **.gitignore**
- Prevents sensitive files from being committed
- Excludes `node_modules`, `.env`, logs, etc.

---

## 🚀 Next Steps - What You Need to Do

### Step 1: Install Dependencies

Open your terminal in the project directory and run:

```bash
npm install
```

This will install:
- express (web server)
- pg (PostgreSQL client)
- dotenv (environment variables)

### Step 2: Create NeonDB Cluster

1. Go to [neon.tech](https://neon.tech)
2. Sign up / Log in
3. Click "Create Project"
4. Choose a project name (e.g., "ai-code-reviewer")
5. Select a region close to you
6. Click "Create Project"

### Step 3: Get Database Connection String

After creating the project, you'll see a connection string like:

```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Copy this entire string!**

### Step 4: Create `.env` File

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your connection string:
   ```
   DATABASE_URL=postgresql://your-connection-string-here
   PORT=3000
   NODE_ENV=development
   ```

### Step 5: Test Database Connection

Run the test script:

```bash
node src/test-db.js
```

You should see:
```
🧪 Testing database connection...
✅ Database connection established
🔌 Database connected at: 2024-01-15T10:30:00.000Z
✅ SUCCESS: Database connection is working!
```

### Step 6: Test the Server

Start the server:

```bash
npm run dev
```

You should see:
```
🚀 Server running on port 3000
📍 Health check: http://localhost:3000/health
🌍 Environment: development
```

Open your browser to `http://localhost:3000/health` - you should see:
```json
{
  "status": "ok",
  "message": "AI Code Review Bot is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## ✅ Task 1 Completion Checklist

- [ ] `npm install` completed successfully
- [ ] NeonDB cluster created
- [ ] `.env` file created with DATABASE_URL
- [ ] `node src/test-db.js` shows success
- [ ] `npm run dev` starts server without errors
- [ ] Health check endpoint returns "ok"
- [ ] Git repository initialized
- [ ] Initial commit made

---

## 🎓 Key Concepts You Learned

### 1. **Connection Pooling**
Instead of creating a new database connection for each request (slow!), we maintain a pool of reusable connections. This is crucial for performance.

### 2. **Environment Variables**
Sensitive data (passwords, API keys) should NEVER be in code. We use `.env` files locally and environment variables in production.

### 3. **ES6 Modules**
Modern JavaScript uses `import/export` instead of `require()`. We enabled this with `"type": "module"` in package.json.

### 4. **SSL Configuration**
NeonDB requires SSL connections. We configured this in the database pool with `ssl: { rejectUnauthorized: false }`.

### 5. **Middleware**
`app.use(express.json())` is middleware that parses JSON request bodies automatically.

---

## ❓ Troubleshooting

### "Cannot find module" error
- Make sure you ran `npm install`

### Database connection fails
- Verify DATABASE_URL is correct in `.env`
- Check NeonDB dashboard shows cluster is active
- Ensure connection string includes `?sslmode=require`

### Port already in use
- Change PORT in `.env` to a different number (e.g., 3001)
- Or stop any process using port 3000

---

## 📌 What's Next?

**Task 2: Database Schema Design**

Now that we have a working connection to NeonDB, we'll:
- Design the database schema (tables, relationships)
- Create an ER diagram
- Write SQL migration scripts
- Set up the database structure

**Let me know when you're ready to proceed!**
