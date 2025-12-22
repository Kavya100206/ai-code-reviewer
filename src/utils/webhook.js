/**
 * GitHub Webhook Utilities
 * Handles webhook signature verification
 */

import crypto from 'crypto';

/**
 * Verify GitHub webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - X-Hub-Signature-256 header value
 * @param {string} secret - Webhook secret from .env
 * @returns {boolean} True if signature is valid
 */
export function verifyGitHubSignature(payload, signature, secret) {
    if (!signature) {
        return false;
    }

    // GitHub sends signature as "sha256=<hash>"
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    // Timing-safe comparison to prevent timing attacks
    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(digest)
        );
    } catch (error) {
        return false;
    }
}

/**
 * Parse GitHub event type from headers
 * @param {Object} headers - Request headers
 * @returns {string|null} Event type or null
 */
export function getGitHubEvent(headers) {
    return headers['x-github-event'] || null;
}

/**
 * Get GitHub delivery ID for logging
 * @param {Object} headers - Request headers
 * @returns {string|null} Delivery ID or null
 */
export function getDeliveryId(headers) {
    return headers['x-github-delivery'] || null;
}
