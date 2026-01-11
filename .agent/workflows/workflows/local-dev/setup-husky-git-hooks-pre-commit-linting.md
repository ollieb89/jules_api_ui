# Setup Husky Git Hooks

**Tags:** Git, Automation, Quality, CI/CD, CI/CD, Testing, Build, +1, Git, GitHub, Team, +1, Linting, ESLint, Prettier, +1, CI/CD, GitHub Actions, GitLab CI, Python, DevOps, Infrastructure, Agentic AI, DevOps, CI/CD

description: Automate code quality checks with pre-commit and pre-push hooks

1. **Install Husky**:
   - Install husky and lint-staged.
     // turbo
   - Run npm install --save-dev husky lint-staged

2. **Initialize Husky**:
   - Set up git hooks.
     // turbo
   - Run npx husky init

3. **Create Pre-Commit Hook**:
   - Run linting on staged files before commit.
     // turbo
   - Run npx husky add .husky/pre-commit "npx lint-staged"

4. **Configure lint-staged**:
   - Add to package.json.
     {
     "lint-staged": {
     "_.{ts,tsx}": [
     "eslint --fix",
     "prettier --write"
     ],
     "_.{json,md}": [
     "prettier --write"
     ]
     }
     }

5. **Create Pre-Push Hook (Optional)**:
   - Run tests before pushing.
     // turbo
   - Run npx husky add .husky/pre-push "npm test"

6. **Advanced: Commit Message Validation**:
   - Install commitlint.
     // turbo
   - Run npm install --save-dev @commitlint/cli @commitlint/config-conventional
   - Create commitlint.config.js:
     module.exports = { extends: ['@commitlint/config-conventional'] };
   - Add hook:
     // turbo
   - Run npx husky add .husky/commit-msg "npx commitlint --edit $1"

7. **Pro Tips**:
   - Skip hooks if needed: git commit --no-verify.
   - Hooks run locally, so they're fast feedback loops.
   - Combine with CI/CD for double protection.
   - If husky commands fail, manually create files in .husky/ directory.
