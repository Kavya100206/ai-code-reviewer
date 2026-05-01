/**
 * Insights routes — read-only analytics over review_findings.
 * Powers the dashboard at /dashboard.html.
 */

import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// pg returns COUNT(...) as BIGINT, which the driver hands back as a string.
// Coerce to Number for clean JSON output.
function toInt(v) {
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

router.get('/risky-files', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
              file_path,
              COUNT(*)                                  AS total_issues,
              COUNT(*) FILTER (WHERE severity = 'high') AS high_severity
            FROM review_findings
            WHERE is_structured = TRUE
              AND file_path IS NOT NULL
            GROUP BY file_path
            ORDER BY high_severity DESC, total_issues DESC
            LIMIT 10
        `);

        res.json(rows.map(r => ({
            file_path: r.file_path,
            total_issues: toInt(r.total_issues),
            high_severity: toInt(r.high_severity)
        })));
    } catch (error) {
        console.error('insights/risky-files failed:', error.message);
        res.status(500).json({ error: 'query_failed' });
    }
});

router.get('/issue-patterns', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT issue_type, severity, COUNT(*) AS count
            FROM review_findings
            WHERE is_structured = TRUE
            GROUP BY issue_type, severity
            ORDER BY count DESC
        `);

        res.json(rows.map(r => ({
            issue_type: r.issue_type,
            severity: r.severity,
            count: toInt(r.count)
        })));
    } catch (error) {
        console.error('insights/issue-patterns failed:', error.message);
        res.status(500).json({ error: 'query_failed' });
    }
});

router.get('/severity-trend', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
              DATE_TRUNC('day', created_at) AS day,
              severity,
              COUNT(*)                       AS count
            FROM review_findings
            WHERE is_structured = TRUE
            GROUP BY day, severity
            ORDER BY day DESC
            LIMIT 30
        `);

        res.json(rows.map(r => ({
            day: r.day instanceof Date ? r.day.toISOString() : r.day,
            severity: r.severity,
            count: toInt(r.count)
        })));
    } catch (error) {
        console.error('insights/severity-trend failed:', error.message);
        res.status(500).json({ error: 'query_failed' });
    }
});

router.get('/author-patterns', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT
              rf.pr_number,
              rf.repo_id,
              r.owner,
              r.name,
              COUNT(*)                                     AS total_issues,
              COUNT(*) FILTER (WHERE rf.severity = 'high') AS high_issues
            FROM review_findings rf
            LEFT JOIN repositories r ON r.id = rf.repo_id
            WHERE rf.is_structured = TRUE
            GROUP BY rf.pr_number, rf.repo_id, r.owner, r.name
            ORDER BY high_issues DESC, total_issues DESC
            LIMIT 10
        `);

        res.json(rows.map(r => ({
            pr_number: r.pr_number,
            owner: r.owner,
            name: r.name,
            total_issues: toInt(r.total_issues),
            high_issues: toInt(r.high_issues)
        })));
    } catch (error) {
        console.error('insights/author-patterns failed:', error.message);
        res.status(500).json({ error: 'query_failed' });
    }
});

export default router;
