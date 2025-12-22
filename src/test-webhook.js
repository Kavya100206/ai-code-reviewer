/**
 * Webhook Testing Script
 * Simulates GitHub webhook requests to test our endpoint
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_URL = 'http://localhost:3000/webhook/github';
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

/**
 * Generate GitHub-style signature
 */
function generateSignature(payload, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    return 'sha256=' + hmac.update(payload).digest('hex');
}

/**
 * Send test webhook
 */
async function sendWebhook(eventType, payload, options = {}) {
    const payloadString = JSON.stringify(payload);
    const signature = options.invalidSignature
        ? 'sha256=invalid'
        : generateSignature(payloadString, WEBHOOK_SECRET);

    console.log(`\n🧪 Testing: ${options.testName || eventType}`);
    console.log('─'.repeat(60));

    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-GitHub-Event': eventType,
                'X-GitHub-Delivery': crypto.randomUUID(),
                'X-Hub-Signature-256': signature,
            },
            body: payloadString,
        });

        const result = await response.json();

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Response:', result);

        if (options.expectedStatus && response.status !== options.expectedStatus) {
            console.log(`❌ FAILED: Expected ${options.expectedStatus}, got ${response.status}`);
        } else {
            console.log('✅ PASSED');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('🚀 Starting webhook tests...');
    console.log(`Server: ${WEBHOOK_URL}`);

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Invalid signature (should reject)
    await sendWebhook('pull_request', {
        action: 'opened',
        pull_request: { number: 1, title: 'Test PR', user: { login: 'testuser' } },
        repository: { full_name: 'test/repo' }
    }, {
        testName: 'Invalid Signature',
        invalidSignature: true,
        expectedStatus: 401
    });

    // Test 2: Wrong event type (should ignore)
    await sendWebhook('push', {
        ref: 'refs/heads/main',
        repository: { full_name: 'test/repo' }
    }, {
        testName: 'Wrong Event Type (push)',
        expectedStatus: 200
    });

    // Test 3: Valid pull_request opened (should accept)
    await sendWebhook('pull_request', {
        action: 'opened',
        pull_request: {
            number: 42,
            title: 'Add new feature',
            user: { login: 'johndoe' }
        },
        repository: { full_name: 'myorg/myrepo' }
    }, {
        testName: 'Valid PR Opened',
        expectedStatus: 200
    });

    // Test 4: PR closed (should ignore)
    await sendWebhook('pull_request', {
        action: 'closed',
        pull_request: {
            number: 43,
            title: 'Another PR',
            user: { login: 'janedoe' }
        },
        repository: { full_name: 'myorg/myrepo' }
    }, {
        testName: 'PR Closed (should ignore)',
        expectedStatus: 200
    });

    // Test 5: Valid PR synchronize (should accept)
    await sendWebhook('pull_request', {
        action: 'synchronize',
        pull_request: {
            number: 44,
            title: 'Updated PR',
            user: { login: 'bobsmith' }
        },
        repository: { full_name: 'myorg/myrepo' }
    }, {
        testName: 'Valid PR Synchronize',
        expectedStatus: 200
    });

    console.log('\n' + '═'.repeat(60));
    console.log('✅ All tests completed!');
    console.log('═'.repeat(60));
}

// Check if webhook secret is configured
if (!WEBHOOK_SECRET) {
    console.error('❌ GITHUB_WEBHOOK_SECRET not found in .env');
    console.error('Please add it to your .env file');
    process.exit(1);
}

runTests();
