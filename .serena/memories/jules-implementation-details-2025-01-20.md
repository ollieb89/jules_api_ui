# Jules Implementation Details & Gotchas
**Date**: 2025-01-20  
**Context**: Specific implementation details, workarounds, and important notes

## Virtual Scrolling Decision

### Issue
CDK Virtual Scroll doesn't work well with Angular 21's new control flow syntax (`@for`). The `*cdkVirtualFor` directive conflicts with `@for`.

### Solution
Used scrollable container with `max-h-[600px] overflow-y-auto` instead of true virtual scrolling. This works well for datasets up to 1000 items.

### Future
If Angular adds better virtual scroll support for control flow, can upgrade to true CDK virtual scrolling.

## Activity Card Component

### Status
Component created but not yet integrated into activity timeline. Timeline currently uses inline display.

### Integration Path
To integrate:
1. Import `ActivityCardComponent` in `ActivityTimelineComponent`
2. Replace inline activity display with `<app-activity-card [activity]="activity"></app-activity-card>`
3. Remove duplicate formatting logic from timeline

## API Key Encryption

### Current Implementation
Using base64 encoding (not encryption) for API key storage in database.

### Security Note
**Production Concern**: Base64 is not encryption, just encoding. For production, should use:
- `cryptography.fernet.Fernet` with proper key management
- Or Django's built-in encryption utilities
- Or environment variables only (no database storage)

### Migration Path
1. Add `cryptography` to `pixi.toml` dependencies
2. Update `JulesSettings.set_api_key()` to use Fernet encryption
3. Update `JulesSettings.get_api_key()` to decrypt
4. Migrate existing base64-encoded keys

## Session Cache Service

### Architecture
- Fetches all sessions (up to MAX_SESSIONS = 1000) on initial load
- Caches in memory for client-side filtering/sorting
- Uses signals for reactive updates

### Performance
- Initial load: Fetches all pages sequentially
- Filtering: Client-side, instant (computed signal)
- Sorting: Client-side, instant (computed signal)

### Limitations
- Max 1000 sessions cached
- No real-time updates (would need WebSocket)
- Full reload on refresh

## Theme Service

### Implementation
- Detects system preference on init
- Persists user choice to localStorage
- Watches system preference changes
- Applies `.dark` class to `<html>` element

### CSS Variables
Defined in `styles.css`:
- `--color-bg-primary`, `--color-bg-secondary`, etc.
- Light mode: default values
- Dark mode: `.dark` class overrides

### Usage
```typescript
// In component
themeService = inject(ThemeService);
themeService.toggle(); // Toggle light/dark
themeService.setMode('system'); // Follow system
```

## Diff Viewer

### Implementation
Pure CSS highlighting for git patches:
- Lines starting with `+` → `.diff-line-add` (green)
- Lines starting with `-` → `.diff-line-remove` (red)
- Lines starting with `@@` → `.diff-line-header` (blue)
- Other lines → `.diff-line-context` (gray)

### Parsing
Simple line-by-line parsing in `parseDiff()` method. No external libraries needed.

## Clipboard Service

### Implementation
- Uses `navigator.clipboard.writeText()` (modern browsers)
- Fallback to `document.execCommand('copy')` for older browsers
- Returns Promise<boolean> for success/failure

### Usage
```typescript
clipboardService = inject(ClipboardService);
await clipboardService.copyToClipboard(text);
```

## Settings Backend

### Model
- Singleton pattern: Only one `JulesSettings` instance (pk=1)
- `get_settings()` class method: Gets or creates singleton
- API key stored in `_encrypted_api_key` field (base64 encoded)

### API Endpoints
- `GET /api/jules/settings/` - Get current settings (masked key)
- `POST /api/jules/settings/api-key/` - Update API key
- `POST /api/jules/settings/test/` - Test connection

### JulesApiClient Integration
Updated to check database settings first:
```python
try:
    from .models import JulesSettings
    settings_obj = JulesSettings.get_settings()
    self.api_key = settings_obj.get_api_key()
except Exception:
    self.api_key = None

if not self.api_key:
    self.api_key = getattr(settings, "JULES_API_KEY", os.getenv("JULES_API_KEY"))
```

## Form Validation Patterns

### Wizard Validation
- Step 1: Source required
- Step 2: Prompt required, min 10 characters
- Step 3: Review (no validation, just display)

### Error Display
- Field-level errors: Show below input when invalid and touched
- Form-level errors: Show at top of form
- Success messages: Green banner at top

## Originator Filtering

### Implementation
Inferred from activity type:
- **Agent**: `plan_generated`, `progress_updated`, `session_completed`
- **User**: `plan_approved`

### Future
If API adds explicit `originator` field, update to use that instead of inference.

## PR Information

### Current Status
Placeholder structure in `SessionDetailComponent`:
- `prInfo` signal with `PRInfo` interface
- Display section ready
- No actual PR data extraction yet

### Future
Need to:
1. Check if PR info comes in session metadata
2. Or extract from activities (look for PR creation activity)
3. Or add separate API endpoint for PR info

## WebSocket Integration

### Placeholder
Structure ready in `SessionDetailComponent`:
- `websocketConnected` signal
- `initializeWebSocket()` method (commented out)
- Ready for django-channels integration

### Implementation Path
1. Install django-channels
2. Create WebSocket consumer for session updates
3. Connect from frontend using WebSocket API
4. Update session data on message received

## Database Migration

### Required
Need to run migrations for `JulesSettings` model:
```bash
cd jules_backend
pixi run makemigrations
pixi run migrate
```

### Migration Will Create
- `jules_settings` table
- Fields: `id`, `_encrypted_api_key`, `created_at`, `updated_at`

## Component Dependencies

### Session List
- `SessionCacheService` - Data management
- `ThemeService` - Theme toggle
- `Router` - Navigation

### Session Detail
- `JulesService` - API calls
- `ActivityTimelineComponent` - Activity display

### Activity Timeline
- `JulesService` - Activity fetching
- `PlanApprovalComponent` - Plan approval UI
- `FormsModule` - Originator filter dropdown

### Activity Card
- `ClipboardService` - Copy functionality
- Standalone component (can be used anywhere)

### Settings
- `JulesService` - Settings API calls
- `FormBuilder` - API key form

## Error Handling Patterns

### Frontend
- Service-level: `handleError` in `JulesService`
- Component-level: Error signals with user-friendly messages
- Display: Red banners with retry buttons

### Backend
- Try/except blocks in ViewSets
- Consistent error response format: `{"error": str(e)}`
- Appropriate HTTP status codes

## Type Safety

### Frontend
- All interfaces defined in `models/jules.model.ts`
- No `any` types used
- Full TypeScript strict mode

### Backend
- Type hints on all functions
- MyPy compatible
- Serializer validation for type safety
