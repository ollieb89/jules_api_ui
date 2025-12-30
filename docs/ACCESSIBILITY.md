# Jules API UI Accessibility Guidelines

## Color & Contrast
- Text contrast must meet WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text).
- Interactive elements (buttons, inputs, focus rings) must maintain a minimum 3:1 contrast ratio.
- Do not rely on color alone to convey meaning; pair with icons or text labels.

## Focus & Interaction
- Use `:focus-visible` styles to ensure keyboard users can see focus states.
- Focus rings use `--color-focus-ring` and `--color-focus-ring-offset` to remain visible on all
  surfaces.

## Dark Mode
- Dark mode is enabled through `prefers-color-scheme: dark` and `.dark` overrides.
- Always verify contrast ratios when introducing new surfaces or typography styles.

## Validation States
- Use semantic classes (`.input-error`, `.input-success`, `.input-warning`) or
  `aria-invalid="true"` to indicate validation status.
- Pair color with text descriptions and inline help messages when possible.

## Testing Checklist
- Run contrast checks using WebAIM or Lighthouse.
- Test light and dark modes for all primary flows.
- Use color vision deficiency simulators to verify semantic color differentiation.
- Validate focus visibility with keyboard navigation.
