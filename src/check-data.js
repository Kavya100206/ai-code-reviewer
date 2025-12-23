/**
 * Check what data is stored in PostgreSQL after webhook tests
 */

import pool from './config/database.js';

async function checkData() {
    console.log('📊 Checking data in PostgreSQL...\n');

    try {
        // Check repositories
        const repos = await pool.query('SELECT * FROM repositories ORDER BY created_at DESC LIMIT 5');
        console.log('✅ Repositories:', repos.rows.length);
        repos.rows.forEach(r => {
            console.log(`   - ${r.owner}/${r.name} (ID: ${r.id}, GitHub ID: ${r.github_repo_id})`);
        });

        // Check pull requests
        const prs = await pool.query('SELECT * FROM pull_requests ORDER BY created_at DESC LIMIT 5');
        console.log('\n✅ Pull Requests:', prs.rows.length);
        prs.rows.forEach(pr => {
            console.log(`   - PR #${pr.pr_number}: ${pr.title} [${pr.status}] by ${pr.author}`);
        });

        // Check review jobs
        const jobs = await pool.query('SELECT * FROM review_jobs ORDER BY created_at DESC LIMIT 5');
        console.log('\n✅ Review Jobs:', jobs.rows.length);
        jobs.rows.forEach(job => {
            console.log(`   - Job ${job.id}: PR ${job.pr_id} - Status: ${job.status}, Attempts: ${job.attempts}`);
        });

        console.log('\n✨ All data retrieved successfully!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkData();
