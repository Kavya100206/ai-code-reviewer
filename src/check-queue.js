/**
 * Check Redis queue status
 */

import { reviewQueue, getQueueStats } from './config/queue.js';

async function checkQueue() {
    console.log('📊 Checking Redis Queue...\n');

    try {
        // Get queue statistics
        const stats = await getQueueStats();

        console.log('✅ Queue Statistics:');
        console.log(`   - Waiting jobs: ${stats.waiting}`);
        console.log(`   - Active jobs: ${stats.active}`);
        console.log(`   - Completed jobs: ${stats.completed}`);
        console.log(`   - Failed jobs: ${stats.failed}`);

        // Get recent completed jobs
        const completed = await reviewQueue.getCompleted(0, 4);
        console.log(`\n✅ Recent Completed Jobs: ${completed.length}`);
        completed.forEach(job => {
            console.log(`   - Job ${job.id}: PR #${job.data.prNumber} from ${job.data.repoFullName}`);
            console.log(`     Status: ${job.finishedOn ? 'Completed' : 'Processing'}`);
        });

        // Get waiting jobs
        const waiting = await reviewQueue.getWaiting(0, 4);
        console.log(`\n✅ Waiting Jobs: ${waiting.length}`);
        waiting.forEach(job => {
            console.log(`   - Job ${job.id}: PR #${job.data.prNumber} from ${job.data.repoFullName}`);
        });

        console.log('\n✨ Queue check complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await reviewQueue.close();
        process.exit(0);
    }
}

checkQueue();
