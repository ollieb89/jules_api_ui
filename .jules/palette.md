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

## 2026-01-30 - Global Button Styles vs Icon Buttons
**Learning:** The project applies aggressive global styles (background, padding, border) to all `<button>` elements via `button.css`. This breaks the styling of icon-only buttons or interactive toggles that should appear as text/icons.
**Action:** When creating icon-only buttons or toggles inside other components, explicitly reset these styles using `!bg-transparent !border-0 !p-1` (or appropriate tailwind classes) to prevent inheriting the primary button look.
