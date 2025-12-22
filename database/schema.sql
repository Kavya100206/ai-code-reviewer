-- ============================================
-- AI Code Review Bot - Database Schema
-- PostgreSQL (NeonDB)
-- ============================================

-- Drop existing tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS review_comments CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS review_jobs CASCADE;
DROP TABLE IF EXISTS pull_requests CASCADE;
DROP TABLE IF EXISTS repositories CASCADE;

-- Drop trigger function if exists
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;

-- ============================================
-- Helper Functions
-- ============================================

-- Auto-update timestamp trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Table 1: repositories
-- Stores GitHub repos where the bot is installed
-- ============================================

CREATE TABLE repositories (
  id BIGSERIAL PRIMARY KEY,
  
  -- GitHub metadata
  github_repo_id BIGINT NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  owner VARCHAR(255) NOT NULL,
  installation_id BIGINT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_repositories_timestamp
BEFORE UPDATE ON repositories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================================
-- Table 2: pull_requests
-- Stores PRs being reviewed
-- ============================================

CREATE TABLE pull_requests (
  id BIGSERIAL PRIMARY KEY,
  
  -- Relationship
  repo_id BIGINT NOT NULL,
  
  -- PR metadata
  pr_number INT NOT NULL,
  title TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  
  -- Status
  status VARCHAR(20) CHECK (status IN ('open', 'closed', 'merged')) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_repo
    FOREIGN KEY (repo_id)
    REFERENCES repositories(id)
    ON DELETE CASCADE,
    
  CONSTRAINT unique_pr_per_repo
    UNIQUE (repo_id, pr_number)
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_pull_requests_timestamp
BEFORE UPDATE ON pull_requests
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================================
-- Table 3: review_jobs
-- Tracks async processing queue
-- ============================================

CREATE TABLE review_jobs (
  id BIGSERIAL PRIMARY KEY,
  
  -- Relationship
  pr_id BIGINT NOT NULL,
  
  -- Job status
  status VARCHAR(20) CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ) NOT NULL,
  
  -- Retry logic
  attempts INT DEFAULT 0,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_pr_job
    FOREIGN KEY (pr_id)
    REFERENCES pull_requests(id)
    ON DELETE CASCADE
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_review_jobs_timestamp
BEFORE UPDATE ON review_jobs
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================================
-- Table 4: reviews
-- AI-generated review output
-- ============================================

CREATE TABLE reviews (
  id BIGSERIAL PRIMARY KEY,
  
  -- Relationship
  pr_id BIGINT NOT NULL,
  
  -- Review content
  review_content TEXT NOT NULL,
  ai_model VARCHAR(100) NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_pr_review
    FOREIGN KEY (pr_id)
    REFERENCES pull_requests(id)
    ON DELETE CASCADE
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_reviews_timestamp
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================================
-- Table 5: review_comments
-- Individual line-level feedback
-- ============================================

CREATE TABLE review_comments (
  id BIGSERIAL PRIMARY KEY,
  
  -- Relationship
  review_id BIGINT NOT NULL,
  
  -- Location
  file_path TEXT NOT NULL,
  line_number INT,
  
  -- Classification
  category VARCHAR(20) CHECK (
    category IN ('bug', 'security', 'performance', 'style', 'best_practice')
  ) NOT NULL,
  
  severity VARCHAR(20) CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ) NOT NULL,
  
  -- Feedback
  comment TEXT NOT NULL,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT fk_review_comment
    FOREIGN KEY (review_id)
    REFERENCES reviews(id)
    ON DELETE CASCADE
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Foreign key indexes (for JOIN performance)
CREATE INDEX idx_pr_repo ON pull_requests(repo_id);
CREATE INDEX idx_job_pr ON review_jobs(pr_id);
CREATE INDEX idx_review_pr ON reviews(pr_id);
CREATE INDEX idx_comment_review ON review_comments(review_id);

-- Frequently filtered columns
CREATE INDEX idx_job_status ON review_jobs(status);
CREATE INDEX idx_comment_severity ON review_comments(severity);
CREATE INDEX idx_comment_category ON review_comments(category);

-- For looking up repos by GitHub ID
CREATE INDEX idx_github_repo_id ON repositories(github_repo_id);

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE repositories IS 'GitHub repositories where the AI Code Review Bot is installed';
COMMENT ON TABLE pull_requests IS 'Pull requests being reviewed by the bot';
COMMENT ON TABLE review_jobs IS 'Async job queue for processing reviews';
COMMENT ON TABLE reviews IS 'AI-generated code reviews';
COMMENT ON TABLE review_comments IS 'Individual line-level feedback items from AI reviews';

COMMENT ON COLUMN review_jobs.attempts IS 'Number of retry attempts for failed jobs';

-- ============================================
-- Schema Creation Complete
-- ============================================
