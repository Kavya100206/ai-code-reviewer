/**
 * GitHub Webhook Routes
 * Handles incoming webhook events from GitHub
 */

import express from 'express';
import { verifyGitHubSignature, getGitHubEvent, getDeliveryId } from '../utils/webhook.js';

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



    // Respond quickly (GitHub expects response within 10 seconds)
    res.status(200).json({
        message: 'Webhook received',
        deliveryId,
        action,
        prNumber: pull_request.number
    });

    // In Task 5, we'll add job queue here to process asynchronously
});

// Health check for webhook endpoint
router.get('/github', (req, res) => {
    res.status(200).json({
        message: 'GitHub webhook endpoint is ready',
        listening: true
    });
});

export default router;
