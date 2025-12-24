/**
 * Queue Configuration
 * Sets up BullMQ job queue with Upstash Redis
 */

import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Parse Upstash Redis URL (remove https://)
const redisUrl = process.env.REDIS_URL?.replace('https://', '');
const redisToken = process.env.REDIS_TOKEN;

// Create Redis connection for BullMQ
const connection = new IORedis({
    host: redisUrl,
    port: 6379,
    username: 'default',
    password: redisToken,
    tls: {
        rejectUnauthorized: false,
    },
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: true,
    retryStrategy: (times) => {
        console.log(`Redis connection retry attempt ${times}`);
        return Math.min(times * 50, 2000);
    }
});

// Add connection event listeners
connection.on('connect', () => {
    console.log('✅ Queue Redis connected to:', redisUrl);
});

connection.on('ready', () => {
    console.log('✅ Queue Redis ready for commands');
});

connection.on('error', (err) => {
    console.error('❌ Queue Redis error:', err.message);
});

connection.on('close', () => {
    console.log('⚠️ Queue Redis connection closed');
});

connection.on('reconnecting', () => {
    console.log('🔄 Queue Redis reconnecting...');
});

/**
 * Review Job Queue
 * Handles PR review job processing
 */
export const reviewQueue = new Queue('pr-reviews', {
    connection,
    defaultJobOptions: {
        attempts: 3,                    // Retry up to 3 times
        backoff: {
            type: 'exponential',          // Exponential backoff: 1s, 2s, 4s
            delay: 1000,                  // Initial delay: 1 second
        },
        removeOnComplete: {
            age: 24 * 3600,               // Keep completed jobs for 24 hours
            count: 100,                   // Keep last 100 completed jobs
        },
        removeOnFail: {
            age: 7 * 24 * 3600,           // Keep failed jobs for 7 days
        },
    },
});

/**
 * Job Types
 */
export const JOB_TYPES = {
    REVIEW_PR: 'review-pr',
};

/**
 * Add a review job to the queue
 * @param {Object} data - Job data
 * @param {number} data.prId - Pull request database ID
 * @param {number} data.repoId - Repository database ID
 * @param {number} data.prNumber - GitHub PR number
 * @param {string} data.repoFullName - Repository full name (owner/repo)
 * @returns {Promise<Job>} The created job
 */
export async function enqueueReview(data) {
    console.log('📤 Enqueueing job to queue: pr-reviews');
    console.log('   Job data:', JSON.stringify(data, null, 2));

    const job = await reviewQueue.add(JOB_TYPES.REVIEW_PR, data);

    console.log(`✅ Job enqueued: ${job.id}`);
    console.log(`   Job name: ${job.name}`);
    console.log(`   Queue name: ${reviewQueue.name}`);
    console.log(`   PR #${data.prNumber} from ${data.repoFullName}`);

    // Check queue stats
    const stats = await getQueueStats();
    console.log(`   Queue stats - Waiting: ${stats.waiting}, Active: ${stats.active}`);

    return job;
}

/**
 * Get queue stats
 * @returns {Promise<Object>} Queue statistics
 */
export async function getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
        reviewQueue.getWaitingCount(),
        reviewQueue.getActiveCount(),
        reviewQueue.getCompletedCount(),
        reviewQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
}

/**
 * Get the shared Redis connection
 * This ensures worker and queue use the same connection
 * @returns {IORedis} Redis connection instance
 */
export function getQueueConnection() {
    return connection;
}

export default reviewQueue;
