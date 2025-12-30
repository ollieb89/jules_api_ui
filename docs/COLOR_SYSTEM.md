# Jules API UI Color System

## Overview
The Jules API UI color system provides a single source of truth for brand, semantic, and neutral
colors. All colors are exposed as CSS custom properties and mirrored in TypeScript constants so
components can consume tokens consistently in SSR and client contexts.

## Token Structure
```
colors/
  brand/
    primary
    secondary
  semantic/
    success
    error
    warning
    info
  neutral/
    gray
  surface/
    background
    surface
    overlay
  interaction/
    hover
    active
    disabled
    focus
```

## Usage Guidelines
- Always use CSS variables (`--color-*`) instead of hard-coded values.
- Prefer semantic tokens for UI states (success, error, warning, info).
- Use surface tokens for layout backgrounds and cards.
- Ensure focus rings remain visible across light and dark modes.

## CSS Variable Entry Points
- `jules_api/src/styles/colors/palette.css` defines the raw palette.
- `jules_api/src/styles/colors/semantic.css` defines semantic aliases.
- `jules_api/src/styles/colors/dark-mode.css` defines dark-mode overrides.

## TypeScript Access
Use the helper utilities for SSR-safe access:
- `jules_api/src/theme/colors.ts` exposes `themeColors` and `getColorTokenValue`.
- `jules_api/src/hooks/useColorToken.ts` reads CSS tokens in the browser.

## Component Mappings
- Buttons: `--color-interactive-primary` and related hover/active/disabled tokens.
- Inputs: `--color-surface-primary`, `--color-border-default`, `--color-focus-ring`.
- Cards: `--color-surface-primary`, `--color-border-default`, `--shadow-color-neutral`.
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`.

## Future Extensions
Add new palettes by extending the `colorPalette` object in
`jules_api/src/constants/colors.ts` and adding matching CSS variables in
`palette.css` and `semantic.css`.
