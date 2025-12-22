# 📊 Task 2: Step-by-Step Database Setup

## ✅ What We Just Created

You now have three database files:

1. **`database/schema.sql`** - Complete database structure
2. **`database/seed.sql`** - Sample test data
3. **`database/migrate.js`** - Automated migration script

---

## 🎯 What's in the Final Schema?

### **Improvements from Your Design:**

✅ **Your excellent base** (all 5 tables, foreign keys, constraints, indexes)  
✅ **Auto-update triggers** - `updated_at` automatically updates  
✅ **Extra PR metadata** - `base_branch`, `head_branch`, `url`, `is_draft`  
✅ **Cost tracking** - `tokens_used`, `cost_usd` in reviews table  
✅ **VARCHAR optimization** - For enum-like fields  
✅ **Table comments** - Documentation in the database itself  
✅ **Verification query** - Confirms tables were created

---

## 📋 Step-by-Step Deployment

### **Step 1: Run the Migration Script**

This will create all tables in NeonDB:

```bash
node database/migrate.js
```

**Expected Output:**
```
🔧 Starting database migration...

📄 Loaded schema.sql
✅ Schema executed successfully!

📊 Tables created:
   - repositories
   - pull_requests
   - review_jobs
   - reviews
   - review_comments

✅ Migration completed successfully!
```

**If you see this, your database is ready!** 🎉

---

### **Step 2: Insert Sample Data (Optional but Recommended)**

This adds test data so you can practice queries:

**Option A: Using psql (if installed)**
```bash
psql $DATABASE_URL -f database/seed.sql
```

**Option B: Using Node.js (create a script)**
Create `database/seed.js`:
```javascript
import fs from 'fs';
import pool from '../src/config/database.js';

const seed = fs.readFileSync('database/seed.sql', 'utf8');
await pool.query(seed);
await pool.end();
console.log('✅ Seed data inserted!');
```

Then run:
```bash
node database/seed.js
```

**Option C: Manually in NeonDB Console**
1. Go to NeonDB dashboard
2. Click "SQL Editor"
3. Copy/paste contents of `database/seed.sql`
4. Click "Run"

---

### **Step 3: Verify Everything Works**

Run some test queries in NeonDB SQL Editor or using psql:

**Query 1: List all tables**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected:** You should see all 5 tables

---

**Query 2: Check table structure**
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'pull_requests'
ORDER BY ordinal_position;
```

**Expected:** All columns you defined

---

**Query 3: Test relationships (if seed data inserted)**
```sql
SELECT 
  r.name as repo_name,
  pr.pr_number,
  pr.title,
  rj.status as job_status
FROM repositories r
JOIN pull_requests pr ON r.id = pr.repo_id
LEFT JOIN review_jobs rj ON pr.id = rj.pr_id;
```

**Expected:** Sample data showing relationships working

---

**Query 4: Test constraints (should FAIL)**
```sql
-- This should error because status is invalid
INSERT INTO review_jobs (pr_id, status) 
VALUES (1, 'invalid_status');
```

**Expected Error:** `new row for relation "review_jobs" violates check constraint`

**This is GOOD! It proves your constraints work!** ✅

---

### **Step 4: Create ER Diagram (Optional)**

Visual representation helps with understanding:

**Option A: Text-based (in docs)**
```
repositories (1) ─────< (many) pull_requests
                               │
                               ├─────< (many) review_jobs
                               │
                               └─────< (many) reviews
                                              │
                                              └─────< (many) review_comments
```

**Option B: Use a tool**
- [dbdiagram.io](https://dbdiagram.io)
- [draw.io](https://draw.io)
- NeonDB has built-in schema visualization

---

## 🎓 Understanding the Improvements

### **1. Auto-Update Trigger**

**Before:**
```sql
UPDATE pull_requests SET status = 'closed' WHERE pr_number = 42;
-- updated_at stays the same ❌
```

**After (with trigger):**
```sql
UPDATE pull_requests SET status = 'closed' WHERE pr_number = 42;
-- updated_at automatically changes to NOW() ✅
```

**How it works:**
```sql
CREATE TRIGGER update_pull_requests_timestamp
BEFORE UPDATE ON pull_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
```

Every time you UPDATE a row, PostgreSQL:
1. Runs the trigger BEFORE the update
2. Sets `NEW.updated_at = NOW()`
3. Saves the updated row

---

### **2. Draft PR Optimization**

**Why `is_draft` field?**

Draft PRs are work-in-progress. Reviewing them wastes AI API credits!

**Usage:**
```javascript
// Skip drafts when creating review jobs
const pr = await getPullRequest();
if (pr.is_draft) {
  console.log('Skipping draft PR');
  return;
}
// Otherwise, create review job...
```

**Index for fast lookups:**
```sql
CREATE INDEX idx_pr_draft ON pull_requests(is_draft) 
WHERE is_draft = TRUE;
```

This partial index only indexes draft PRs, making it very fast and small.

---

### **3. Cost Tracking**

**Why track tokens?**

OpenAI charges per token:
- gpt-4-turbo: ~$0.01 per 1000 input tokens
- Claude: Similar pricing

**Example calculation:**
```javascript
const tokensUsed = 2500;
const costPer1000 = 0.01;
const cost = (tokensUsed / 1000) * costPer1000;  // $0.025

await pool.query(`
  INSERT INTO reviews (pr_id, review_content, tokens_used, cost_usd)
  VALUES ($1, $2, $3, $4)
`, [prId, content, tokensUsed, cost]);
```

**Later, analyze costs:**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as reviews_count,
  SUM(tokens_used) as total_tokens,
  SUM(cost_usd) as total_cost
FROM reviews
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### **4. CASCADE Delete**

**Test this behavior:**

```sql
-- Delete a repository
DELETE FROM repositories WHERE github_repo_id = 123456789;

-- All related data automatically deleted:
-- ❌ All pull_requests for that repo
-- ❌ All review_jobs for those PRs
-- ❌ All reviews for those PRs
-- ❌ All review_comments for those reviews
```

**Why this is useful:**
- Clean uninstalls when bot is removed from a repo
- No orphaned data
- Maintains referential integrity

---

## ✅ Task 2 Completion Checklist

- [ ] Run `node database/migrate.js` successfully
- [ ] Verify 5 tables created in NeonDB
- [ ] Insert seed data (optional)
- [ ] Test queries work
- [ ] Test constraints work (invalid insert fails)
- [ ] Understand triggers and cascades
- [ ] Document schema in README (next step)

---

## 🚀 Next Steps

Once your schema is deployed:

1. **Document it** - Update README with database section
2. **Screenshot NeonDB** - Show tables for your portfolio
3. **Move to Task 3** - GitHub App Setup

---

## 📸 Portfolio Screenshots to Take

1. **NeonDB Tables List** - Showing all 5 tables
2. **Table Structure** - Show `pull_requests` table details
3. **Terminal Output** - Migration success message
4. **Sample Query Results** - JOIN query showing relationships

These prove you understand database design! 📊

---

**Ready? Run Step 1 now:**

```bash
node database/migrate.js
```

Let me know the output! 🎯
