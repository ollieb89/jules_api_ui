# Implement Blue-Green Deployment

**Tags:** Deployment, DevOps, Zero-Downtime, Feature Flags, Deployment, A/B Testing, +1, CI/CD, GitHub Actions, Deployment, Vercel, Deployment, CI/CD, Next.js, Deployment, DevOps, MLOps, Deployment, DevOps, Migrations, DevOps, Database

description: Zero-downtime deploys

1. **Setup Two Environments**:
   - Blue: Current (v1.0)
   - Green: New (v1.1)

2. **Route Traffic Gradually**:
   const rolloutPercent = await get('green_rollout') || 0;
   if (Math.random() \* 100 < rolloutPercent) {
   return NextResponse.rewrite(new URL('/green', request.url));
   }

3. **Monitor Metrics**:
   Sentry.setTag('environment', isGreen ? 'green' : 'blue');

4. **Pro Tips**:
   - Test thoroughly before routing.
   - Keep blue for rollback.
