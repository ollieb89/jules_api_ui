---
description: CI/CD, GitHub Actions, Deployment, Vercel, Deployment, CI/CD, Deployment, DevOps, Zero-Downtime, Feature Flags, Deployment, A/B Testing, +1, CI/CD, GitHub Actions, GitLab CI, Next.js, Deployment, DevOps, Agentic AI, DevOps, CI/CD
---

# Setup Preview Deployments

**Tags:** CI/CD, GitHub Actions, Deployment, Vercel, Deployment, CI/CD, Deployment, DevOps, Zero-Downtime, Feature Flags, Deployment, A/B Testing, +1, CI/CD, GitHub Actions, GitLab CI, Next.js, Deployment, DevOps, Agentic AI, DevOps, CI/CD

description: Auto-deploy PRs

1. **Create GitHub Action**:
   name: Preview
   on:
   pull_request:
   types: [opened, synchronize]
   jobs:
   deploy:
   runs-on: ubuntu-latest
   steps: - uses: actions/checkout@v4 - uses: actions/setup-node@v4 - run: npm ci - run: npm run build - uses: amondnet/vercel-action@v25

2. **Comment PR**:
   - Add deployment URL to PR comments.

3. **Pro Tips**:
   - Add E2E tests.
   - Clean up old previews.
