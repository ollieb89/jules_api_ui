---
trigger: model_decision
description: # Turborepo + ESLint Rules
---

# Turborepo + ESLint Rules

## Purpose

Provide consistent linting across the monorepo.

---

## Mandatory Usage

- Centralize ESLint config in a shared package
- Use a single `lint` task name

---

## Prohibited Usage

- Generating outputs from lint tasks

---

## Tasks

- `lint`: cacheable, no outputs
