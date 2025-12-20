# Jules API Serializer Patterns

## Core Principles
1. **API Structure Alignment**: Serializers must match Jules API structure exactly
2. **CamelCase Normalization**: Handle both camelCase (from API) and snake_case (internal)
3. **State Validation**: Always validate and default states to prevent invalid values
4. **Title/Description Fallback**: Use title as primary, fallback to description

## Step Structure (Jules API)
```python
{
  "id": "string",
  "index": integer,
  "title": "string",  # Primary display text
  "description": "string",  # Detailed description
  "state": "STATE_UNSPECIFIED" | "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED",
  "artifacts": [...]
}
```

## Serializer Implementation Pattern

### StepSerializer
- Fields: `id`, `index`, `title`, `description`, `state`, `artifacts`
- `to_internal_value`: Normalize camelCase, provide defaults
- `to_representation`: Validate states, use title with description fallback
- State validation: Always ensure valid enum values, default to "STATE_UNSPECIFIED"

### ProgressUpdatedActivitySerializer
- Fields: `title`, `description`, `artifacts` (NOT `step_index`/`step_state`)
- Matches API structure exactly

### PlanSerializer
- Fields: `steps` (array of StepSerializer), `state`
- Validates both plan state and all step states
- Filters invalid step entries

## Frontend Display Patterns

### State Labels
- `STATE_UNSPECIFIED` → Display as "Unspecified" (NOT "Unknown")
- Consistent across all components

### Step Display
- Primary: `step.title`
- Fallback: `step.description`
- Final fallback: `'Step ' + (index + 1)`

### UI Format
- Clean numbered lists: `<ol class="list-decimal list-inside">`
- Material chips for state indicators
- Inline state chips after step text

## Common Issues Fixed
1. KeyError on missing fields → Added proper defaults in `to_internal_value`
2. "Unknown" states → Changed to "Unspecified" with proper validation
3. Missing title field → Added to models and serializers
4. Inconsistent formatting → Added `to_representation` methods