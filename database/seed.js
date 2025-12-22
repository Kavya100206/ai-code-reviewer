/**
 * Database Seed Script
 * Inserts sample test data into the database
 */

import fs from 'fs';
import pool from '../src/config/database.js';

async function runSeed() {
    console.log('🌱 Inserting seed data...\n');

    try {
        // Read seed.sql file
        const seedSQL = fs.readFileSync('database/seed.sql', 'utf8');

        console.log('📄 Loaded seed.sql');

        // Execute seed data
        await pool.query(seedSQL);

        console.log('✅ Seed data inserted successfully!\n');

        // Verify data was inserted
        const result = await pool.query(`
      SELECT 'Repositories' as table_name, COUNT(*) as count FROM repositories
      UNION ALL
      SELECT 'Pull Requests', COUNT(*) FROM pull_requests
      UNION ALL
      SELECT 'Review Jobs', COUNT(*) FROM review_jobs
      UNION ALL
      SELECT 'Reviews', COUNT(*) FROM reviews
      UNION ALL
      SELECT 'Review Comments', COUNT(*) FROM review_comments
      ORDER BY table_name
    `);

        console.log('📊 Data inserted:');
        result.rows.forEach(row => {
            console.log(`   ${row.table_name}: ${row.count} row(s)`);
        });

        console.log('\n✅ Seed completed successfully!\n');

    } catch (error) {
        console.error('❌ Seed failed:');
        console.error(error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runSeed();
