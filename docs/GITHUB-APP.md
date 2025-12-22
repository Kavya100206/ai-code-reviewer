# 📌 GitHub App Configuration

## Overview

GitHub App credentials for authenticating with GitHub's API and receiving webhook events.

---

## App Details

**What it does:**
- Receives webhook events when PRs are opened/updated
- Authenticates API requests to fetch PR code
- Posts review comments back to GitHub

---

## Credentials

Store these in your `.env` file (never commit!):

```bash
GITHUB_APP_ID=123456
GITHUB_INSTALLATION_ID=12345678
GITHUB_WEBHOOK_SECRET=your_secret_here
GITHUB_PRIVATE_KEY_PATH=./pr-review-engine.2025-12-22.private-key.pem
```

### **What Each Credential Does:**

| Credential | Purpose |
|------------|---------|
| `GITHUB_APP_ID` | Identifies your GitHub App |
| `GITHUB_INSTALLATION_ID` | Links to where your app is installed |
| `GITHUB_WEBHOOK_SECRET` | Verifies webhook requests are from GitHub |
| `GITHUB_PRIVATE_KEY_PATH` | Authenticates API requests |

---

## Permissions Configured

**Repository permissions:**
- **Pull requests:** Read & Write (read PR details, post comments)
- **Contents:** Read-only (access code diffs)
- **Metadata:** Read-only (basic repo info)

**Webhook events subscribed:**
- `pull_request` (opened, synchronize, reopened)

---

## How Authentication Works

### **1. Webhook Signature Verification**

GitHub signs each webhook request with your secret:

```javascript
const signature = req.headers['x-hub-signature-256'];
// Verify this matches our computed signature
```

This proves the request came from GitHub, not a hacker.

---

### **2. API Authentication (JWT + Installation Token)**

To call GitHub API, we need a token. Process:

1. Create JWT using `GITHUB_APP_ID` + `PRIVATE_KEY`
2. Exchange JWT for installation access token
3. Use token to make API calls

**Token expires in 1 hour** - we'll handle refresh automatically.

---

## Security Best Practices

✅ **DO:**
- Keep private key secure (in `.gitignore`)
- Use strong webhook secret (20+ random chars)
- Rotate secrets periodically
- Use environment variables in production

❌ **DON'T:**
- Commit `.pem` file to Git
- Share secrets in screenshots
- Hardcode credentials in code
- Reuse secrets across apps

---

## Testing Connection (Later)

Once we build the webhook handler (Task 4), test by:

1. Opening a PR in your test repo
2. GitHub sends webhook to your endpoint
3. Your app verifies signature
4. Authenticates with GitHub API
5. Fetches PR details

---

## Troubleshooting

### Private key not found
- Check `GITHUB_PRIVATE_KEY_PATH` matches actual filename
- Ensure file is in project root (or use absolute path)

### API returns 401 Unauthorized
- Verify `GITHUB_APP_ID` is correct
- Check private key is the right one
- Ensure app is installed on the repo

### Webhook signature mismatch
- Check `GITHUB_WEBHOOK_SECRET` matches GitHub App settings
- Ensure using the raw request body (not parsed JSON)

---

## References

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [Authenticating with GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app)
- [Webhook Events](https://docs.github.com/en/webhooks/webhook-events-and-payloads)
