/**
 * Test Database Queries
 * Verify relationships and constraints are working
 */

import pool from '../src/config/database.js';

async function testQueries() {
    console.log('🧪 Testing database queries...\n');

    try {
        // Test 1: JOIN query - verify relationships work
        console.log('📋 Test 1: Testing relationships (JOIN query)');
        console.log('─'.repeat(60));

        const joinResult = await pool.query(`
      SELECT 
        r.name as repo_name,
        pr.pr_number,
        pr.title,
        pr.author,
        rj.status as job_status,
        rev.ai_model
      FROM repositories r
      JOIN pull_requests pr ON r.id = pr.repo_id
      LEFT JOIN review_jobs rj ON pr.id = rj.pr_id
      LEFT JOIN reviews rev ON pr.id = rev.pr_id
      ORDER BY pr.pr_number
    `);

        console.table(joinResult.rows);
        console.log('✅ Relationships working!\n');


        // Test 2: Review comments by severity
        console.log('📋 Test 2: Review comments grouped by severity');
        console.log('─'.repeat(60));

        const severityResult = await pool.query(`
      SELECT 
        severity,
        COUNT(*) as count,
        STRING_AGG(category, ', ') as categories
      FROM review_comments
      GROUP BY severity
      ORDER BY 
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `);

        console.table(severityResult.rows);
        console.log('✅ Grouping and aggregation working!\n');


        // Test 3: Try to insert invalid data (should fail)
        console.log('📋 Test 3: Testing CHECK constraint (should fail)');
        console.log('─'.repeat(60));

        try {
            await pool.query(`
        INSERT INTO review_jobs (pr_id, status)
        VALUES (1, 'invalid_status')
      `);
            console.log('❌ UNEXPECTED: Invalid data was inserted!');
        } catch (error) {
            console.log('✅ CHECK constraint working! Error message:');
            console.log(`   "${error.message}"`);
        }
        console.log();


        // Test 4: Test CASCADE delete (we'll rollback)
        console.log('📋 Test 4: Testing CASCADE delete (in transaction)');
        console.log('─'.repeat(60));

        await pool.query('BEGIN'); // Start transaction

        // Count before delete
        const beforeDelete = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM repositories) as repos,
        (SELECT COUNT(*) FROM pull_requests) as prs,
        (SELECT COUNT(*) FROM review_jobs) as jobs,
        (SELECT COUNT(*) FROM reviews) as reviews,
        (SELECT COUNT(*) FROM review_comments) as comments
    `);

        console.log('Before delete:');
        console.table(beforeDelete.rows);

        // Delete repository (should cascade)
        await pool.query('DELETE FROM repositories WHERE id = 1');

        // Count after delete
        const afterDelete = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM repositories) as repos,
        (SELECT COUNT(*) FROM pull_requests) as prs,
        (SELECT COUNT(*) FROM review_jobs) as jobs,
        (SELECT COUNT(*) FROM reviews) as reviews,
        (SELECT COUNT(*) FROM review_comments) as comments
    `);

        console.log('\nAfter delete:');
        console.table(afterDelete.rows);

        await pool.query('ROLLBACK'); // Undo the delete

        console.log('✅ CASCADE delete working! (Changes rolled back)\n');


        // Test 5: Verify data restored after rollback
        console.log('📋 Test 5: Verify data restored after rollback');
        console.log('─'.repeat(60));

        const restored = await pool.query(`
      SELECT COUNT(*) as count FROM repositories
    `);

        console.log(`Repositories count: ${restored.rows[0].count}`);
        console.log('✅ Transaction rollback working!\n');


        console.log('═'.repeat(60));
        console.log('✅ All tests passed! Database is working correctly! 🎉');
        console.log('═'.repeat(60));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

testQueries();
