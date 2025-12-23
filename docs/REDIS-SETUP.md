# 📋 Task 5 - Step 1: Set Up Redis (Upstash)

## 🎯 What You'll Do:

Create a free Redis database in the cloud (no installation needed!)

---

## 📝 Instructions:

### **1. Go to Upstash**
Visit: https://upstash.com

### **2. Sign up** 
- Click "Sign Up"
- Use GitHub login for quick signup (recommended)
- It's completely free!

### **3. Create Redis Database**
- Click **"Create Database"** button
- Fill in:
  - **Name:** `ai-code-reviewer`
  - **Type:** Regional (default)
  - **Region:** Choose closest to your location
  - **TLS:** Leave enabled (default)
- Click **"Create"**

### **4. Get Connection Details**
After creation:
- Click on your database name
- Scroll down to **"REST API"** section
- You'll see two important values:
  - **UPSTASH_REDIS_REST_URL** (looks like: `https://your-db-abc123.upstash.io`)
  - **UPSTASH_REDIS_REST_TOKEN** (long string)
- Copy both!

### **5. Add to `.env` File**

Open your `.env` file and add these lines:

```env
# Redis Configuration (Upstash)
REDIS_URL=https://your-actual-url.upstash.io
REDIS_TOKEN=your_actual_token_here
```

**Important:** Replace with your actual values!

---

## ✅ Verification

Your `.env` should now have:
- ✅ DATABASE_URL (from Task 1)
- ✅ GITHUB_APP_ID (from Task 3)
- ✅ GITHUB_INSTALLATION_ID (from Task 3)
- ✅ GITHUB_WEBHOOK_SECRET (from Task 3)
- ✅ GITHUB_PRIVATE_KEY_PATH (from Task 3)
- ✅ REDIS_URL (new!)
- ✅ REDIS_TOKEN (new!)

---

## 🆓 Free Tier Limits

Upstash free tier gives you:
- 10,000 commands per day
- More than enough for this project!
- No credit card required

---

**Once you've added Redis credentials to `.env`, let me know and I'll give you Step 2 (install BullMQ)!**
