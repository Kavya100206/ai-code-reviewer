/**
 * Main entry point for AI Code Review Bot
 * 
 * This file initializes:
 * - Environment configuration
 * - Database connection
 * - Express server
 * - Background worker (in same process for free tier)
 */

import dotenv from 'dotenv';
import express from 'express';
import webhookRoutes from './routes/webhook.js';
import healthRoutes from './routes/health.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Mount webhook routes (has its own body parser)
app.use('/webhook', webhookRoutes);

// Middleware for other routes
app.use(express.json()); // Parse JSON request bodies

// Mount health check routes
app.use('/', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to AI Code Review Bot',
        version: '1.0.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Webhook endpoint: http://localhost:${PORT}/webhook/github`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Start worker in the same process (for free tier deployment)
console.log('🔄 Starting background worker in same process...');
import('./worker.js').then(() => {
    console.log('✅ Worker module loaded');
}).catch(err => {
    console.error('❌ Failed to load worker:', err.message);
});
