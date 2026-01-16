## 2025-12-21 - Accessible Confirmation Dialog
**Learning:** Native `confirm()` blocks the main thread and offers poor accessibility control. Custom dialogs using the `<dialog>` element provide better keyboard navigation, styling control, and non-blocking behavior while maintaining semantic correctness.
**Action:** Replace `confirm()` calls with `<app-confirmation-dialog>` (or similar semantic modals) to ensure consistent, accessible, and non-blocking user interactions for destructive actions.
## 2025-12-27 - Semantic Stepper Navigation
**Learning:** Using `<ol>` and `<li>` with `aria-current='step'` creates a semantic wizard stepper that is automatically announced correctly by screen readers, without needing complex ARIA management.
**Action:** Replace div-based steppers with ordered lists in future multi-step forms.

## 2026-01-13 - Optimistic UI Updates
**Learning:** Reloading full lists after a single item deletion causes unnecessary layout shifts and visual "jank" (spinners). Optimistic updates using local state signals provide a smoother, instant experience.
**Action:** When performing destructive actions on lists, update the local signal immediately upon success instead of re-fetching the entire list.

## 2026-01-16 - Accessible Toggle Patterns
**Learning:** Visual-only toggle buttons (using arrow icons) lack semantic state. Adding `aria-expanded` and `aria-controls` provides critical context to screen readers about what is being controlled and its current state.
**Action:** Ensure all collapsible sections use button elements with proper ARIA attributes, not just visual indicators.
