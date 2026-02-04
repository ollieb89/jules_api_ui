## 2025-12-21 - Accessible Confirmation Dialog
**Learning:** Native `confirm()` blocks the main thread and offers poor accessibility control. Custom dialogs using the `<dialog>` element provide better keyboard navigation, styling control, and non-blocking behavior while maintaining semantic correctness.
**Action:** Replace `confirm()` calls with `<app-confirmation-dialog>` (or similar semantic modals) to ensure consistent, accessible, and non-blocking user interactions for destructive actions.
## 2025-12-27 - Semantic Stepper Navigation
**Learning:** Using `<ol>` and `<li>` with `aria-current='step'` creates a semantic wizard stepper that is automatically announced correctly by screen readers, without needing complex ARIA management.
**Action:** Replace div-based steppers with ordered lists in future multi-step forms.

## 2026-01-13 - Optimistic UI Updates
**Learning:** Reloading full lists after a single item deletion causes unnecessary layout shifts and visual "jank" (spinners). Optimistic updates using local state signals provide a smoother, instant experience.
**Action:** When performing destructive actions on lists, update the local signal immediately upon success instead of re-fetching the entire list.

## 2026-01-15 - Native Dialog Backdrop Interaction
**Learning:** The native `<dialog>` element does not automatically close when clicking the backdrop, unlike many custom modal implementations. This expectation is strong for users. The backdrop click event targets the `dialog` element itself, allowing easy detection.
**Action:** Always implement a click handler on `<dialog>` elements to check `event.target === element` and close the dialog to match user expectations.

## 2026-02-04 - Contextual Actions on Hover
**Learning:** Actions that are useful but not primary (like "Copy to Clipboard") can be kept accessible but visually unobtrusive by using `opacity-0` with `group-hover:opacity-100` and `focus:opacity-100`. This reduces visual clutter while maintaining discoverability and keyboard accessibility.
**Action:** Use the "hover-reveal" pattern for secondary utility actions on data displays (like code blocks, IDs, or timestamps), ensuring `focus-visible` styles are included for keyboard users.
