/**
 * GitHub API Client Configuration
 * Handles authentication for GitHub App
 */

import { App } from '@octokit/app';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Create GitHub App instance
 * This handles JWT creation and token management
 */
const app = new App({
    appId: process.env.GITHUB_APP_ID,
    privateKey: fs.readFileSync(process.env.GITHUB_PRIVATE_KEY_PATH, 'utf8'),
});

/**
 * Get authenticated GitHub client (Octokit instance)
 * Creates a fresh installation token each time (valid for 1 hour)
 * 
 * @returns {Promise<Octokit>} Authenticated Octokit client
 */
export async function getGitHubClient() {
    try {
        const installationId = parseInt(process.env.GITHUB_INSTALLATION_ID);

        // Get authenticated Octokit instance for this installation
        // Octokit automatically handles:
        // 1. Creating JWT from private key
        // 2. Exchanging JWT for installation token
        // 3. Using token for API requests
        const octokit = await app.getInstallationOctokit(installationId);

        console.log('✅ GitHub client authenticated');
        return octokit;

    } catch (error) {
        console.error('❌ Failed to create GitHub client:', error.message);
        throw error;
    }
}

export default app;
