# Dependency Reset Workflow

**Tags:** Workflows, Node.js, Troubleshooting, Workflows, Automation, Best Practices, Workflows, Git, Version Control, Workflows, React, Component, Node.js, Debugging, Dependencies, npm, Troubleshooting, Dependencies, Debugging, Git, Dependencies

Fix "it works on my machine" issues by resetting dependencies.

Workflow File: .agent/workflows/reset_deps.md

description: Completely reset node_modules and reinstall dependencies to fix issues

1. Delete the existing node_modules folder to ensure a clean slate.
   // turbo
2. Run rm -rf node_modules
3. Delete the package-lock.json file to avoid version conflicts.
   // turbo
4. Run rm package-lock.json
5. Reinstall all dependencies from scratch.
   // turbo
6. Run npm install

Usage:

- Say "Reset dependencies" or use /reset_deps
- All commands run automatically with turbo
- Wait for npm install to complete

When to Use:

- Dependency version conflicts
- Corrupted node_modules
- "Module not found" errors
- After switching branches
- Clean environment needed

Safety:

- Uses turbo because commands are safe
- No data loss (only dependencies)
- Can be run anytime
- Reproducible from package.json

Variations:

- Add cache clearing: npm cache clean --force
- Support yarn: rm -rf node_modules yarn.lock && yarn install
- Include .next or dist folder cleanup
- Add verification step after install
