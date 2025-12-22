-- ============================================
-- Sample Test Data
-- For testing queries and debugging
-- ============================================

-- 1. Insert a sample repository
INSERT INTO repositories (github_repo_id, name, owner, installation_id)
VALUES 
  (123456789, 'test-repo', 'johndoe', 987654321);

-- 2. Insert sample pull requests
INSERT INTO pull_requests (
  repo_id, pr_number, title, author, status
)
VALUES 
  (1, 42, 'Add user authentication feature', 'janedoe', 'open'),
  (1, 43, 'Fix memory leak in data processor', 'bobsmith', 'open');

-- 3. Insert sample review jobs
INSERT INTO review_jobs (pr_id, status, attempts, completed_at)
VALUES 
  (1, 'completed', 1, NOW() - INTERVAL '1 hour'),
  (2, 'pending', 0, NULL);

-- 4. Insert a sample AI review
INSERT INTO reviews (pr_id, review_content, ai_model)
VALUES 
  (
    1,
    'Overall, the authentication implementation looks good. Found a few security concerns and performance optimizations.',
    'gpt-4-turbo-preview'
  );

-- 5. Insert sample review comments
INSERT INTO review_comments (
  review_id, file_path, line_number, category, severity, comment
)
VALUES 
  (
    1,
    'src/auth/login.js',
    45,
    'security',
    'critical',
    'Password is being logged in plaintext. This is a serious security vulnerability. Remove this log statement immediately.'
  ),
  (
    1,
    'src/auth/session.js',
    89,
    'performance',
    'medium',
    'Consider using Redis for session storage instead of in-memory storage for better scalability.'
  ),
  (
    1,
    'src/auth/middleware.js',
    12,
    'best_practice',
    'low',
    'Consider extracting this validation logic into a separate utility function for better reusability.'
  );

-- ============================================
-- Verification Queries
-- ============================================

-- Check data was inserted
SELECT 'Repositories:' as table_name, COUNT(*) as count FROM repositories
UNION ALL
SELECT 'Pull Requests:', COUNT(*) FROM pull_requests
UNION ALL
SELECT 'Review Jobs:', COUNT(*) FROM review_jobs
UNION ALL
SELECT 'Reviews:', COUNT(*) FROM reviews
UNION ALL
SELECT 'Review Comments:', COUNT(*) FROM review_comments;

-- Test JOIN query
SELECT 
  r.name as repo_name,
  pr.pr_number,
  pr.title,
  rj.status as job_status,
  rev.ai_model,
  COUNT(rc.id) as comment_count
FROM repositories r
JOIN pull_requests pr ON r.id = pr.repo_id
LEFT JOIN review_jobs rj ON pr.id = rj.pr_id
LEFT JOIN reviews rev ON pr.id = rev.pr_id
LEFT JOIN review_comments rc ON rev.id = rc.review_id
GROUP BY r.name, pr.pr_number, pr.title, rj.status, rev.ai_model
ORDER BY pr.pr_number;
