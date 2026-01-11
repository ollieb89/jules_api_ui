---
description: Configure linting and formatting (ESLint 9 Flat Config)
---

# Setup Prettier & ESLint from Scratch

**Tags:** ESLint, Prettier, Code Quality, Setup, Linting, ESLint, Prettier, +1, Config, Environment, Setup, Git, Automation, Quality, +1, Agentic AI, Refactoring, Clean Code, Agentic AI, Reasoning, Planning, Agentic AI, Prompt Engineering, LLM

description: Configure linting and formatting (ESLint 9 Flat Config)

1. **Install Dependencies**:
   - Install ESLint, Prettier, and configs.
     // turbo
   - Run npm install --save-dev eslint @eslint/js typescript-eslint prettier eslint-config-prettier eslint-plugin-react-hooks eslint-plugin-react-refresh globals

2. **Create eslint.config.js (Flat Config)**:
   - The new standard for ESLint 9.
     import js from '@eslint/js';
     import globals from 'globals';
     import reactHooks from 'eslint-plugin-react-hooks';
     import reactRefresh from 'eslint-plugin-react-refresh';
     import tseslint from 'typescript-eslint';

   export default tseslint.config(
   { ignores: ['dist', '.next'] },
   {
   extends: [js.configs.recommended, ...tseslint.configs.recommended],
   files: ['**/*.{ts,tsx}'],
   languageOptions: {
   ecmaVersion: 2020,
   globals: globals.browser,
   },
   plugins: {
   'react-hooks': reactHooks,
   'react-refresh': reactRefresh,
   },
   rules: {
   ...reactHooks.configs.recommended.rules,
   'react-refresh/only-export-components': [
   'warn',
   { allowConstantExport: true },
   ],
   },
   },
   );

3. **Create .prettierrc**:
   {
   "semi": true,
   "singleQuote": true,
   "tabWidth": 2,
   "trailingComma": "es5",
   "printWidth": 100,
   "plugins": ["prettier-plugin-tailwindcss"]
   }

4. **Add Scripts**:
   {
   "scripts": {
   "lint": "eslint .",
   "lint:fix": "eslint . --fix",
   "format": "prettier --write ."
   }
   }

5. **Pro Tips**:
   - Install VS Code extensions: ESLint, Prettier.
   - Enable "Format on Save" in VS Code settings.
   - ESLint 9 is a major change; old .eslintrc files are deprecated.
