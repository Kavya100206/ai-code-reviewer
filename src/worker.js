/**
 * Job Worker
 * Processes review jobs from the queue
 */

import { Worker } from 'bullmq';
import dotenv from 'dotenv';
import pool from './config/database.js';
import { JOB_TYPES, getQueueConnection } from './config/queue.js';
import { fetchPRData, postReviewComment } from './utils/github-api.js';
import { reviewCodeWithAI } from './services/ai-review.js';
import { formatReviewComment } from './utils/format-review.js';

dotenv.config();

// Use the same Redis connection as the queue
const connection = getQueueConnection();

console.log('✅ Worker using shared Redis connection');



async function processReviewJob(job) {
    const { prId, repoId, prNumber, repoFullName } = job.data;

    console.log('\n' + '='.repeat(60));
    console.log(`Processing Review Job: ${job.id}`);
    console.log(`PR #${prNumber} in ${repoFullName}`);
    console.log('='.repeat(60));

    try {
        // Step 1: Update job status to 'processing' in database
        await pool.query(
            `UPDATE review_jobs 
       SET status = 'processing', updated_at = NOW() 
       WHERE pr_id = $1`,
            [prId]
        );

        console.log('✅ Job status updated to processing');

        // Step 2: Parse repository owner and name from full name
        const [owner, repo] = repoFullName.split('/');
        console.log(`📦 Repository: ${owner}/${repo}`);

        // Step 3: Fetch PR data from GitHub API
        console.log('🔍 Fetching PR data from GitHub...');
        const prData = await fetchPRData(owner, repo, prNumber);

        console.log(`✅ Fetched PR data:`);
        console.log(`   - Title: "${prData.pr.title}"`);
        console.log(`   - Author: @${prData.pr.author}`);
        console.log(`   - Files changed: ${prData.files.length}`);
        console.log(`   - Branch: ${prData.pr.headBranch} → ${prData.pr.baseBranch}`);

        // Step 4: Send code to AI for review
        console.log('🤖 Sending code to AI for review...');
        const aiReview = await reviewCodeWithAI(prData);

        console.log(`✅ AI Review completed:`);
        console.log(`   - Issues found: ${aiReview.issues?.length || 0}`);
        console.log(`   - Summary: ${aiReview.summary}`);

        // Step 5: Store review in database
        console.log('💾 Storing review in database...');
        const reviewResult = await pool.query(
            `INSERT INTO reviews (pr_id, review_content, ai_model, created_at)
             VALUES ($1, $2, $3, NOW  ())
             RETURNING id`,
            [prId, JSON.stringify(aiReview), 'groq-llama-3.3-70b']
        );

        const reviewId = reviewResult.rows[0].id;
        console.log(`Review stored with ID: ${reviewId}`);

        // Step 6: Post review to GitHub PR
        console.log('Posting review to GitHub PR...');
        const commentMarkdown = formatReviewComment(aiReview, prData);
        await postReviewComment(owner, repo, prNumber, commentMarkdown);
        console.log('Review posted to GitHub successfully!');

        // Step 7: Update job status to 'completed' in database
        await pool.query(
            `UPDATE review_jobs 
       SET status = 'completed', completed_at = NOW(), updated_at = NOW() 
       WHERE pr_id = $1`,
            [prId]
        );

        console.log('✅ Job completed successfully');
        console.log('='.repeat(60) + '\n');

        return { success: true };

    } catch (error) {
        console.error('❌ Job failed:', error.message);

        // Update job status to 'failed' in database
        await pool.query(
            `UPDATE review_jobs 
       SET status = 'failed', 
           error_message = $1,
           updated_at = NOW() 
       WHERE pr_id = $2`,
            [error.message, prId]
        );

        throw error; // BullMQ will handle retries
    }
}

/**
 * Create and start the worker
 */
const worker = new Worker(
    'pr-reviews',
    async (job) => {
        console.log('🔔 Worker received job:', job.id, 'Type:', job.name);
        if (job.name === JOB_TYPES.REVIEW_PR) {
            return await processReviewJob(job);
        }
        console.error('❌ Unknown job type:', job.name, 'Expected:', JOB_TYPES.REVIEW_PR);
        throw new Error(`Unknown job type: ${job.name}`);
    },
    {
        connection,
        concurrency: 2, // Process up to 2 jobs simultaneously
    }
);

// Worker event handlers
worker.on('completed', (job) => {
    console.log(`✅ Worker completed job ${job.id}`);
});

worker.on('failed', (job, error) => {
    console.error(`Worker failed job ${job.id}:`, error.message);
    console.error(`Attempt ${job.attemptsMade}/${job.opts.attempts}`);
});

worker.on('error', (error) => {
    console.error('Worker error:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing worker...');
    await worker.close();
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, closing worker...');
    await worker.close();
    await pool.end();
    process.exit(0);
});

console.log('Worker started and listening for jobs...');
console.log(`Concurrency: ${worker.concurrency}`);
console.log(`Queue: pr-reviews`);
console.log('Press Ctrl+C to stop\n');

export default worker;
