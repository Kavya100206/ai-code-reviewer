/**
 * Database configuration and connection pool
 * 
 * Uses pg (node-postgres) to connect to NeonDB PostgreSQL
 * Connection pooling ensures efficient database access
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create a connection pool
// Pools manage multiple connections efficiently
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for NeonDB
    },
    // Pool configuration
    max: 20,                    // Maximum number of connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // 10 seconds - allows time for NeonDB to wake up
});

// Event listeners for debugging
pool.on('connect', () => {
    console.log('✅ Database connection established');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    process.exit(-1); // Exit on critical DB errors
});

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection success status
 */
export async function testConnection() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('🔌 Database connected at:', result.rows[0].now);
        client.release(); // Always release connections back to pool
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
export async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('📊 Query executed:', { text, duration: `${duration}ms`, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('❌ Query error:', error);
        throw error;
    }
}

export default pool;
