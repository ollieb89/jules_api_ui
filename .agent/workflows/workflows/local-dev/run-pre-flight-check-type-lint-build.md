# Pre-Flight Check

**Tags:** CI/CD, Testing, Build, Quality, Git, Automation, Quality, +1, Linting, ESLint, Prettier, +1, DevOps, Environment, Vercel, +1, Agentic AI, DevOps, CI/CD, Python, Testing, Quality Assurance, Next.js, Testing, Jest

description: Run type checking, linting, and build verification before pushing

1. **Type Check**:
   - Ensure there are no TypeScript errors.
     // turbo
   - Run npx tsc --noEmit

2. **Lint Check**:
   - Verify code quality rules.
     // turbo
   - Run npm run lint

3. **Build Verification**:
   - Ensure the project builds successfully for production.
     // turbo
   - Run npm run build

4. **Pro Tips**:
   - Use a pre-push git hook (using husky) to run this automatically.
   - If the build fails locally, it will definitely fail in production.
