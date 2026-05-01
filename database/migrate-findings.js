/**
 * Migration: review_findings table
 *
 * Adds a flat, queryable table of per-issue findings derived from the AI
 * review. Lives alongside the existing `reviews` row (which stores the full
 * raw object). Run separately from migrate.js so the original schema is
 * untouched.
 *
 * Idempotent — safe to re-run.
 */

import pool from '../src/config/database.js';

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS review_findings (
  id BIGSERIAL PRIMARY KEY,

  review_job_id BIGINT REFERENCES review_jobs(id) ON DELETE CASCADE,
  repo_id       BIGINT REFERENCES repositories(id) ON DELETE CASCADE,
  pr_number     INTEGER NOT NULL,

  file_path     TEXT,
  line_number   INTEGER,
  issue_type    VARCHAR(20),
  severity      VARCHAR(10),
  description   TEXT,

  is_structured BOOLEAN DEFAULT TRUE,
  raw_fallback  TEXT,

  created_at    TIMESTAMP DEFAULT NOW()
);
`;

const INDEXES_SQL = [
    `CREATE INDEX IF NOT EXISTS idx_findings_repo       ON review_findings(repo_id);`,
    `CREATE INDEX IF NOT EXISTS idx_findings_pr         ON review_findings(pr_number);`,
    `CREATE INDEX IF NOT EXISTS idx_findings_severity   ON review_findings(severity);`,
    `CREATE INDEX IF NOT EXISTS idx_findings_issue_type ON review_findings(issue_type);`,
    `CREATE INDEX IF NOT EXISTS idx_findings_created_at ON review_findings(created_at);`,
    `CREATE INDEX IF NOT EXISTS idx_findings_structured ON review_findings(is_structured);`
];

async function runMigration() {
    console.log('Starting review_findings migration...\n');

    try {
        await pool.query(CREATE_TABLE_SQL);
        console.log('review_findings table ready');

        for (const sql of INDEXES_SQL) {
            await pool.query(sql);
        }
        console.log('Indexes ready');

        const cols = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'review_findings'
            ORDER BY ordinal_position
        `);

        console.log('\nreview_findings columns:');
        cols.rows.forEach(r => {
            const len = r.character_maximum_length ? `(${r.character_maximum_length})` : '';
            console.log(`   - ${r.column_name}: ${r.data_type}${len}`);
        });

        console.log('\nMigration completed successfully.\n');
    } catch (error) {
        console.error('Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
