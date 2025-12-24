/**
 * GitHub API Helper Functions
 * Fetches PR data, files, and diffs from GitHub
 */

import { getGitHubClient } from '../config/github.js';

/**
 * Fetch complete PR data including metadata, files, and diffs
 * 
 * @param {string} owner - Repository owner (e.g., "microsoft")
 * @param {string} repo - Repository name (e.g., "vscode")
 * @param {number} prNumber - Pull request number (e.g., 42)
 * @returns {Promise<Object>} PR data with metadata and files
 */
export async function fetchPRData(owner, repo, prNumber) {
    console.log(`📡 Fetching PR data for ${owner}/${repo}#${prNumber}...`);

    try {
        const octokit = await getGitHubClient();

        // Step 1: Fetch PR metadata
        console.log('   Fetching PR metadata...');
        const prResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
            owner,
            repo,
            pull_number: prNumber
        });

        const pr = prResponse.data;
        console.log(`   ✅ PR: "${pr.title}" by @${pr.user.login}`);
        console.log(`   ✅ ${pr.head.ref} → ${pr.base.ref}`);

        // Step 2: Fetch changed files with diffs
        console.log('   Fetching changed files...');
        const filesResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
            owner,
            repo,
            pull_number: prNumber
        });

        const files = filesResponse.data;
        console.log(`   ✅ Found ${files.length} changed files`);

        // Log file summary
        files.forEach(file => {
            const status = file.status.toUpperCase().padEnd(8);
            const changes = `+${file.additions} -${file.deletions}`;
            console.log(`      ${status} ${file.filename.padEnd(40)} ${changes}`);
        });

        return {
            pr: {
                number: pr.number,
                title: pr.title,
                body: pr.body || '',
                author: pr.user.login,
                state: pr.state,
                headBranch: pr.head.ref,
                baseBranch: pr.base.ref,
                headSha: pr.head.sha,
                baseSha: pr.base.sha,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at
            },
            files: files.map(file => ({
                filename: file.filename,
                status: file.status,        // added, modified, removed, renamed
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: file.patch || null   // The actual diff (+/- lines)
            }))
        };

    } catch (error) {
        console.error(`❌ Failed to fetch PR data: ${error.message}`);
        if (error.status === 404) {
            throw new Error(`PR #${prNumber} not found in ${owner}/${repo}`);
        }
        throw error;
    }
}

/**
 * Extract meaningful code changes from diff patches
 * Filters out unimportant changes like whitespace-only modifications
 * 
 * @param {Array} files - Array of file objects with patches
 * @returns {Array} Files with meaningful changes
 */
export function filterMeaningfulChanges(files) {
    return files.filter(file => {
        // Skip files without patches (binary files, etc.)
        if (!file.patch) {
            return false;
        }

        // Skip files with only whitespace changes
        // (This is a simple check - could be more sophisticated)
        const hasCodeChanges = file.additions > 0 || file.deletions > 0;

        return hasCodeChanges;
    });
}

/**
 * Format PR data for AI review
 * Creates a structured text format that AI can easily understand
 * 
 * @param {Object} prData - PR data from fetchPRData()
 * @returns {string} Formatted text for AI
 */
export function formatPRForAI(prData) {
    const { pr, files } = prData;

    let output = `# Pull Request Review\n\n`;
    output += `**Title:** ${pr.title}\n`;
    output += `**Author:** @${pr.author}\n`;
    output += `**Branch:** ${pr.headBranch} → ${pr.baseBranch}\n`;
    output += `**Files Changed:** ${files.length}\n\n`;

    if (pr.body) {
        output += `**Description:**\n${pr.body}\n\n`;
    }

    output += `---\n\n`;
    output += `## Changed Files\n\n`;

    // Add each file with its diff
    files.forEach(file => {
        output += `### ${file.filename}\n`;
        output += `Status: ${file.status}\n`;
        output += `Changes: +${file.additions} -${file.deletions}\n\n`;

        if (file.patch) {
            output += `\`\`\`diff\n${file.patch}\n\`\`\`\n\n`;
        } else {
            output += `*(No diff available - likely a binary file)*\n\n`;
        }
    });

    return output;
}

/**
 * Post review comment to GitHub PR
 * 
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} prNumber - Pull request number
 * @param {string} commentBody - Markdown formatted comment
 * @returns {Promise<Object>} Comment data from GitHub
 */
export async function postReviewComment(owner, repo, prNumber, commentBody) {
    console.log(`Posting review comment to ${owner}/${repo}#${prNumber}...`);

    try {
        const octokit = await getGitHubClient();

        // Post comment using issues API (PRs are issues in GitHub)
        const response = await octokit.issues.createComment({
            owner,
            repo,
            issue_number: prNumber,
            body: commentBody
        });

        console.log(`Comment posted successfully!`);
        console.log(`   Comment ID: ${response.data.id}`);
        console.log(`   URL: ${response.data.html_url}`);

        return response.data;

    } catch (error) {
        console.error(`Failed to post comment: ${error.message}`);
        throw error;
    }
}

