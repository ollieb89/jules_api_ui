## 2025-12-26 - Accessible Confirmation Dialog Consistency
**Learning:** Inconsistent use of native `confirm()` vs custom dialogs degrades the perceived quality of the application. Users expect consistent interaction patterns for similar actions (e.g., deleting items) across different views.
**Action:** When refactoring for accessibility, ensure that the same interaction pattern (e.g., `<app-confirmation-dialog>`) is applied consistently across all views (List vs Detail) for identical actions.
