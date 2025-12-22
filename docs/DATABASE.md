# 📊 Database Documentation

## Overview

The AI Code Review Bot uses PostgreSQL (NeonDB) to store repositories, pull requests, review jobs, AI-generated reviews, and feedback comments.

---

## Database Schema

### **Entity Relationship Diagram**

```
┌─────────────────┐
│  repositories   │
│─────────────────│
│ id (PK)         │
│ github_repo_id  │
│ name            │
│ owner           │
│ installation_id │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐         ┌──────────────┐
│ pull_requests   │◄────────│ review_jobs  │
│─────────────────│  1:N    │──────────────│
│ id (PK)         │         │ id (PK)      │
│ repo_id (FK)    │         │ pr_id (FK)   │
│ pr_number       │         │ status       │
│ title           │         │ attempts     │
│ author          │         │ error_msg    │
│ status          │         └──────────────┘
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────┐         ┌──────────────────┐
│    reviews      │◄────────│ review_comments  │
│─────────────────│  1:N    │──────────────────│
│ id (PK)         │         │ id (PK)          │
│ pr_id (FK)      │         │ review_id (FK)   │
│ review_content  │         │ file_path        │
│ ai_model        │         │ line_number      │
└─────────────────┘         │ category         │
                            │ severity         │
                            │ comment          │
                            └──────────────────┘
```

---

## Tables

### **1. repositories**

Stores GitHub repositories where the bot is installed.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `github_repo_id` | BIGINT | NOT NULL, UNIQUE | GitHub's repo ID |
| `name` | VARCHAR(255) | NOT NULL | Repository name |
| `owner` | VARCHAR(255) | NOT NULL | Repository owner |
| `installation_id` | BIGINT | NOT NULL | GitHub App installation ID |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Auto-updated on changes |

**Indexes:**
- `idx_github_repo_id` on `github_repo_id`

---

### **2. pull_requests**

Tracks pull requests being reviewed.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `repo_id` | BIGINT | FK → repositories(id) | Parent repository |
| `pr_number` | INT | NOT NULL | PR number (unique per repo) |
| `title` | TEXT | NOT NULL | PR title |
| `author` | VARCHAR(255) | NOT NULL | PR author username |
| `status` | VARCHAR(20) | CHECK constraint | `open`, `closed`, or `merged` |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Auto-updated on changes |

**Constraints:**
- `UNIQUE (repo_id, pr_number)` - No duplicate PR numbers per repo
- `CHECK (status IN ('open', 'closed', 'merged'))`

**Indexes:**
- `idx_pr_repo` on `repo_id`

---

### **3. review_jobs**

Tracks async processing queue for reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `pr_id` | BIGINT | FK → pull_requests(id) | PR being reviewed |
| `status` | VARCHAR(20) | CHECK constraint | Job status |
| `attempts` | INT | DEFAULT 0 | Retry count |
| `error_message` | TEXT | NULL | Error if job failed |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Job created time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Auto-updated |
| `completed_at` | TIMESTAMP | NULL | Job completion time |

**Constraints:**
- `CHECK (status IN ('pending', 'processing', 'completed', 'failed'))`

**Indexes:**
- `idx_job_pr` on `pr_id`
- `idx_job_status` on `status`

---

### **4. reviews**

AI-generated code reviews.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `pr_id` | BIGINT | FK → pull_requests(id) | PR reviewed |
| `review_content` | TEXT | NOT NULL | AI's overall review |
| `ai_model` | VARCHAR(100) | NOT NULL | Model used (e.g., gpt-4) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Review created time |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Auto-updated |

**Indexes:**
- `idx_review_pr` on `pr_id`

---

### **5. review_comments**

Individual line-level feedback items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PRIMARY KEY | Auto-incrementing ID |
| `review_id` | BIGINT | FK → reviews(id) | Parent review |
| `file_path` | TEXT | NOT NULL | File being reviewed |
| `line_number` | INT | NULL | Specific line number |
| `category` | VARCHAR(20) | CHECK constraint | Type of feedback |
| `severity` | VARCHAR(20) | CHECK constraint | How critical |
| `comment` | TEXT | NOT NULL | The actual feedback |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Comment created time |

**Constraints:**
- `CHECK (category IN ('bug', 'security', 'performance', 'style', 'best_practice'))`
- `CHECK (severity IN ('low', 'medium', 'high', 'critical'))`

**Indexes:**
- `idx_comment_review` on `review_id`
- `idx_comment_severity` on `severity`
- `idx_comment_category` on `category`

---

## Design Decisions

### **1. CASCADE Delete**

All foreign keys use `ON DELETE CASCADE`:

```sql
FOREIGN KEY (repo_id) REFERENCES repositories(id) ON DELETE CASCADE
```

**Why:** When a repository is deleted, all related data (PRs, jobs, reviews) is automatically cleaned up. This prevents orphaned records.

---

### **2. Auto-Update Triggers**

`updated_at` columns automatically update on any row modification:

```sql
CREATE TRIGGER update_pull_requests_timestamp
BEFORE UPDATE ON pull_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
```

**Why:** Tracks when records change without manual intervention.

---

### **3. CHECK Constraints**

Enforce valid values at the database level:

```sql
status VARCHAR(20) CHECK (status IN ('open', 'closed', 'merged'))
```

**Why:** Database rejects invalid data, preventing bugs. Application can't accidentally insert invalid status.

---

### **4. Indexes**

Strategic indexes for performance:

- **Foreign keys** - Speed up JOINs
- **Status fields** - Fast filtering (`WHERE status = 'pending'`)
- **Category/Severity** - Quick grouping and filtering

**Trade-off:** Faster reads, slightly slower writes. Worth it for this read-heavy application.

---

### **5. BIGSERIAL vs UUID**

Using `BIGSERIAL` (auto-incrementing 64-bit integers) instead of UUIDs:

**Pros:**
- Simpler, more readable
- Smaller size (8 bytes vs 16 bytes)
- Better index performance
- Sequential = better for B-tree indexes

**Cons:**
- IDs are predictable (not a concern for this app)
- Not globally unique across databases (not a concern for single DB)

---

## Sample Queries

### **Get all pending review jobs**

```sql
SELECT 
  r.name as repo_name,
  pr.pr_number,
  pr.title,
  rj.status,
  rj.attempts
FROM review_jobs rj
JOIN pull_requests pr ON rj.pr_id = pr.id
JOIN repositories r ON pr.repo_id = r.id
WHERE rj.status = 'pending'
ORDER BY rj.created_at;
```

---

### **Get review with all comments**

```sql
SELECT 
  pr.title,
  rev.ai_model,
  rc.file_path,
  rc.line_number,
  rc.severity,
  rc.comment
FROM reviews rev
JOIN pull_requests pr ON rev.pr_id = pr.id
LEFT JOIN review_comments rc ON rev.id = rc.review_id
WHERE pr.pr_number = 42
ORDER BY rc.severity DESC, rc.file_path;
```

---

### **Count reviews by severity**

```sql
SELECT 
  severity,
  COUNT(*) as count
FROM review_comments
GROUP BY severity
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;
```

---

## Migrations

### **Create Schema**

```bash
node database/migrate.js
```

### **Insert Sample Data**

```bash
node database/seed.js
```

### **Test Queries**

```bash
node database/test-queries.js
```

---

## Future Enhancements

Optional fields that could be added later:

- **Cost tracking** - `tokens_used`, `cost_usd` in reviews
- **Branch info** - `base_branch`, `head_branch` in pull_requests
- **Draft detection** - `is_draft` flag in pull_requests
- **Soft deletes** - `deleted_at` timestamp
- **Audit trail** - Separate table for all changes

---

**Note:** Schema is designed for simplicity and learning. Production systems might add additional fields, but this core design is solid and extensible.
