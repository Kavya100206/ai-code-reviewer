/**
 * Health Check Routes
 * Endpoints for monitoring system health
 */

import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * Basic health check
 */
router.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {}
    };

    // Check database
    try {
        await pool.query('SELECT 1');
        health.services.database = 'connected';
    } catch (error) {
        health.status = 'degraded';
        health.services.database = 'disconnected';
    }

    // Check Redis (queue) - basic check
    health.services.queue = 'configured';

    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});

/**
 * Readiness check (for deployment platforms)
 */
router.get('/ready', async (req, res) => {
    try {
        // Check if database is accessible
        await pool.query('SELECT 1');
        res.status(200).json({ ready: true });
    } catch (error) {
        res.status(503).json({ ready: false, error: error.message });
    }
});

export default router;
