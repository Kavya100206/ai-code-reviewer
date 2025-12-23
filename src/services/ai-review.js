/**
 * AI Code Review Engine using Groq (Llama 3.3)
 * Analyzes code changes and generates structured feedback
 */

import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

/**
 * Review code changes using AI
 * 
 * @param {Object} prData - PR data from fetchPRData()
 * @returns {Promise<Object>} Structured review with issues found
 */
export async function reviewCodeWithAI(prData) {
    const { pr, files } = prData;

    console.log(`🤖 Reviewing PR: "${pr.title}"`);
    console.log(`   Files to review: ${files.length}`);

    try {
        // Build the prompt
        const prompt = buildReviewPrompt(pr, files);

        // Call Groq AI
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: SYSTEM_PROMPT
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3, // Lower = more focused and consistent
            max_tokens: 2000
        });

        const aiResponse = completion.choices[0].message.content;

        console.log('✅ AI review completed');

        // Parse the AI response
        const review = parseAIResponse(aiResponse);

        return review;

    } catch (error) {
        console.error('❌ AI review failed:', error.message);
        throw error;
    }
}

/**
 * System prompt that defines AI's role and behavior
 */
const SYSTEM_PROMPT = `You are an expert code reviewer with deep knowledge of:
- Software security vulnerabilities (SQL injection, XSS, auth issues)
- Performance optimizations
- Code quality and best practices
- Common bugs and edge cases

Your task is to review pull request code changes and provide constructive feedback.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief overall assessment in 1-2 sentences",
  "issues": [
    {
      "type": "bug|security|performance|style",
      "severity": "critical|high|medium|low",
      "file": "filename.js",
      "line": 42,
      "title": "Short issue title",
      "description": "Detailed explanation",
      "suggestion": "How to fix it"
    }
  ],
  "positives": ["Good thing 1", "Good thing 2"]
}

If no issues found, return empty "issues" array. Be constructive and specific.`;

/**
 * Build review prompt from PR data
 */
function buildReviewPrompt(pr, files) {
    let prompt = `# Pull Request Review\n\n`;
    prompt += `**Title:** ${pr.title}\n`;
    prompt += `**Description:** ${pr.body || 'No description provided'}\n`;
    prompt += `**Branch:** ${pr.headBranch} → ${pr.baseBranch}\n\n`;
    prompt += `## Code Changes\n\n`;

    // Add each file's changes
    files.forEach(file => {
        if (!file.patch) return; // Skip files without diffs

        prompt += `### ${file.filename}\n`;
        prompt += `Status: ${file.status} (+${file.additions} -${file.deletions})\n\n`;
        prompt += `\`\`\`diff\n${file.patch}\n\`\`\`\n\n`;
    });

    prompt += `Review this pull request and identify any bugs, security issues, performance problems, or style concerns.`;

    return prompt;
}

/**
 * Parse AI response (handles JSON extraction)
 */
function parseAIResponse(aiResponse) {
    try {
        // Try to extract JSON from response
        // Sometimes AI adds extra text before/after JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        // If no JSON found, create a basic review
        return {
            summary: 'AI response could not be parsed',
            issues: [],
            positives: [],
            raw_response: aiResponse
        };

    } catch (error) {
        console.error('Failed to parse AI response:', error.message);

        // Return raw response for debugging
        return {
            summary: 'Parse error',
            issues: [],
            positives: [],
            raw_response: aiResponse
        };
    }
}

export default reviewCodeWithAI;
