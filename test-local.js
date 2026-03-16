/**
 * Local Test Script
 * Test the entire workflow locally without deploying to Render
 */

import dotenv from 'dotenv';
import { fetchPRData } from './src/utils/github-api.js';
import { reviewCodeWithAI } from './src/services/ai-review.js';
import { formatReviewComment } from './src/utils/format-review.js';

dotenv.config();

async function testWorkflow() {
    console.log('🧪 Testing AI Code Review Workflow Locally\n');

    try {
        // Test data - replace with your actual PR
        const owner = 'Kavya100206';
        const repo = 'ai-code-reviewer';
        const prNumber = 2;

        console.log('Step 1: Fetching PR data from GitHub...');
        const prData = await fetchPRData(owner, repo, prNumber);
        console.log('✅ PR data fetched\n');

        console.log('Step 2: Sending code to AI for review...');
        const aiReview = await reviewCodeWithAI(prData);
        console.log('✅ AI review completed\n');

        console.log('Step 3: Testing formatter...');
        console.log('DEBUG - aiReview structure:', JSON.stringify(aiReview, null, 2));

        const commentMarkdown = formatReviewComment(aiReview, prData);
        console.log('✅ Comment formatted successfully\n');

        console.log('Generated Comment Preview:');
        console.log('='.repeat(60));
        console.log(commentMarkdown);
        console.log('='.repeat(60));

        console.log('\n✅ All steps completed successfully!');
        console.log('The workflow is working correctly.');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testWorkflow();
