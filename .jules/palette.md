## 2025-12-21 - Accessible Confirmation Dialog
**Learning:** Native `confirm()` blocks the main thread and offers poor accessibility control. Custom dialogs using the `<dialog>` element provide better keyboard navigation, styling control, and non-blocking behavior while maintaining semantic correctness.
**Action:** Replace `confirm()` calls with `<app-confirmation-dialog>` (or similar semantic modals) to ensure consistent, accessible, and non-blocking user interactions for destructive actions.

## 2025-12-29 - Form UX Polish
**Learning:** Users often scan forms quickly. Visual cues like red asterisks for required fields and explicit placeholders significantly improve scanability and reduce cognitive load. Autofocusing the first input reduces friction. Adding a visual spinner to submit buttons provides immediate, clear feedback that an action is processing, which is superior to just changing text.
**Action:** Always include visual required indicators, helpful placeholders, and loading spinners on form actions to improve usability and perceived performance.
