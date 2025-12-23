/**
 * GitHub Webhook Routes
 * Handles incoming webhook events from GitHub
 */

import express from 'express';
import { verifyGitHubSignature, getGitHubEvent, getDeliveryId } from '../utils/webhook.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * POST /webhook/github
 * Receives webhook events from GitHub
 */
router.post('/github', express.json({
    verify: (req, res, buf) => {
        // Store raw body for signature verification
        req.rawBody = buf.toString('utf8');
    }
}), async (req, res) => {

    const signature = req.headers['x-hub-signature-256'];
    const event = getGitHubEvent(req.headers);
    const deliveryId = getDeliveryId(req.headers);

    console.log(` Webhook received: ${event} (Delivery: ${deliveryId})`);

    // Step 1: Verify signature
    const isValid = verifyGitHubSignature(
        req.rawBody,
        signature,
        process.env.GITHUB_WEBHOOK_SECRET
    );

    if (!isValid) {
        console.error(' Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log(' Signature verified');

    // Step 2: Filter event type
    if (event !== 'pull_request') {
        console.log(`ℹ Ignoring event: ${event}`);
        return res.status(200).json({ message: 'Event ignored' });
    }

    // Step 3: Process pull_request event
    const { action, pull_request, repository } = req.body;

    console.log(` PR Event: ${action}`);
    console.log(` Repo: ${repository.full_name}`);
    console.log(` PR #${pull_request.number}: ${pull_request.title}`);
    console.log(` Author: ${pull_request.user.login}`);

    // Step 4: Filter actions we care about
    const relevantActions = ['opened', 'synchronize', 'reopened'];
    if (!relevantActions.includes(action)) {
        console.log(`ℹIgnoring action: ${action}`);
        return res.status(200).json({ message: 'Action ignored' });
    }

    console.log('Event is relevant for review');

    // Step 5: Save to database and enqueue job
    try {
        // Extract owner from full_name (e.g., "owner/repo" -> "owner")
        const [owner, repoName] = repository.full_name.split('/');

        // Insert or update repository
        const repoResult = await pool.query(
            `INSERT INTO repositories (github_repo_id, name, owner, installation_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (github_repo_id) 
             DO UPDATE SET updated_at = NOW()
             RETURNING id`,
            [
                repository.id,
                repoName,
                owner,
                req.body.installation?.id || 0  // Use 0 for test data
            ]
        );
        const repoId = repoResult.rows[0].id;

        // Insert or update pull request
        const prResult = await pool.query(
            `INSERT INTO pull_requests (repo_id, pr_number, title, author, status)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (repo_id, pr_number) 
             DO UPDATE SET 
                title = EXCLUDED.title,
                status = EXCLUDED.status,
                updated_at = NOW()
             RETURNING id`,
            [
                repoId,
                pull_request.number,
                pull_request.title,
                pull_request.user.login,
                pull_request.state
            ]
        );
        const prId = prResult.rows[0].id;

        // Create review job record
        await pool.query(
            `INSERT INTO review_jobs (pr_id, status, attempts)
             VALUES ($1, 'pending', 0)
             ON CONFLICT (pr_id)
             DO UPDATE SET status = 'pending', updated_at = NOW()`,
            [prId]
        );

        // Enqueue job for background processing
        const { enqueueReview } = await import('../config/queue.js');
        await enqueueReview({
            prId,
            repoId,
            prNumber: pull_request.number,
            repoFullName: repository.full_name
        });

        console.log('✅ PR saved to database and job enqueued');

    } catch (error) {
        console.error('❌ Error saving to database:', error.message);
        return res.status(500).json({ error: 'Failed to process webhook' });
    }
    res.status(200).json({
        message: 'Webhook received',
        deliveryId,
        action,
        prNumber: pull_request.number
    });

});

// Health check for webhook endpoint
router.get('/github', (req, res) => {
    res.status(200).json({
        message: 'GitHub webhook endpoint is ready',
        listening: true
    });
});

export default router;
