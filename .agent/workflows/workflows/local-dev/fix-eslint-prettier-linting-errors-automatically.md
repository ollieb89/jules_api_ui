---
description: Automatically fix linting and formatting issues across the project
---

# Fix Lint Errors

**Tags:** Linting, ESLint, Prettier, Quality, ESLint, Prettier, Code Quality, +1, CI/CD, Testing, Build, +1, Git, Automation, Quality, +1, Rust, Testing, Benchmarking, Rust, Performance, Optimization, Rust, WebAssembly, WASM

description: Automatically fix linting and formatting issues across the project

1. **Run ESLint Fix**:
   - Attempt to automatically fix all fixable ESLint errors.
     // turbo
   - Run npm run lint -- --fix

2. **Run Prettier**:
   - Format all files in the project to ensure consistent style.
     // turbo
   - Run npx prettier --write .

3. **Pro Tips**:
   - Run this before every commit to keep your codebase clean.
   - Configure your editor to 'Format on Save' for real-time feedback.
