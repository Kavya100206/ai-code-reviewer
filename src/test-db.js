/**
 * Database connection test script
 * 
 * Run this to verify your NeonDB connection is working
 * Usage: node src/test-db.js
 */

import { testConnection } from './config/database.js';

async function main() {
    console.log('🧪 Testing database connection...\n');

    const success = await testConnection();

    if (success) {
        console.log('\n✅ SUCCESS: Database connection is working!');
    } else {
        console.log('\n❌ FAILED: Could not connect to database');
        console.log('Please check:');
        console.log('  1. DATABASE_URL in .env file');
        console.log('  2. NeonDB cluster is active');
        console.log('  3. Connection string format is correct\n');
    }

    process.exit(success ? 0 : 1);
}

main();
