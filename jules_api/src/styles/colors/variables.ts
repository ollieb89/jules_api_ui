export const colorTokens = {
  background: {
    primary: '--color-background-primary',
    secondary: '--color-background-secondary',
    tertiary: '--color-background-tertiary',
  },
  surface: {
    primary: '--color-surface-primary',
    secondary: '--color-surface-secondary',
    elevated: '--color-surface-elevated',
    overlay: '--color-surface-overlay',
  },
  text: {
    primary: '--color-text-primary',
    secondary: '--color-text-secondary',
    tertiary: '--color-text-tertiary',
    disabled: '--color-text-disabled',
    inverse: '--color-text-inverse',
  },
  border: {
    default: '--color-border-default',
    subtle: '--color-border-subtle',
    strong: '--color-border-strong',
  },
  interactive: {
    primary: '--color-interactive-primary',
    primaryHover: '--color-interactive-primary-hover',
    primaryActive: '--color-interactive-primary-active',
    primaryDisabled: '--color-interactive-primary-disabled',
    secondary: '--color-interactive-secondary',
    secondaryHover: '--color-interactive-secondary-hover',
    secondaryActive: '--color-interactive-secondary-active',
    secondaryDisabled: '--color-interactive-secondary-disabled',
  },
  state: {
    success: '--color-state-success',
    error: '--color-state-error',
    warning: '--color-state-warning',
    info: '--color-state-info',
  },
  focus: {
    ring: '--color-focus-ring',
    ringOffset: '--color-focus-ring-offset',
  },
} as const;
