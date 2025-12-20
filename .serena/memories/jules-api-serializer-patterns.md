# Jules API Serializer Patterns - CamelCase Handling

## Pattern: DRF Serializer with CamelCase API

When integrating APIs that return camelCase (like Google Jules API) with Django REST Framework that uses snake_case:

### 1. Use `source` Parameter
```python
display_name = serializers.CharField(source="displayName")
create_time = serializers.CharField(source="createTime")
```

### 2. Override `to_internal_value()`
```python
def to_internal_value(self, data):
    """Handle camelCase from API response."""
    if isinstance(data, dict):
        normalized = {
            "name": data.get("name", ""),
            "displayName": data.get("displayName", data.get("display_name", "")),
            "createTime": data.get("createTime", data.get("create_time", "")),
        }
        return normalized
    return super().to_internal_value(data)
```

### 3. Always Use `data=` Parameter in Views
```python
# ✅ CORRECT
serializer = SessionSerializer(data=sessions, many=True)
serializer.is_valid(raise_exception=True)

# ❌ WRONG - doesn't trigger to_internal_value
serializer = SessionSerializer(sessions, many=True)
```

### 4. Handle Both Formats
The `to_internal_value` should handle both camelCase (from API) and snake_case (fallback) to be robust.

## Key Files
- `jules_backend/jules/serializers.py` - All serializers with camelCase handling
- `jules_backend/jules/views.py` - Views using `data=` parameter

## Common Issues
- **KeyError**: Forgot to use `data=` parameter → serializer doesn't normalize
- **Empty fields**: `to_internal_value` not called → fields remain empty
- **Type errors**: Missing `is_valid()` call → validation not performed
