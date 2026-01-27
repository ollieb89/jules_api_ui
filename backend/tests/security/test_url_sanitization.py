import pytest
from unittest.mock import patch
from jules.utils import sanitize_url

def test_sanitize_url_fail_secure_on_error():
    """
    Test that sanitize_url fails securely (redacts everything) when
    URL parsing raises an unexpected exception.
    Current implementation returns original URL (vulnerable), so this test
    is expected to fail before the fix.
    """
    sensitive_url = "https://example.com/api?key=SUPER_SECRET_VALUE"

    # Mock urlsplit to simulate a parsing crash
    with patch("jules.utils.urlsplit", side_effect=Exception("Unexpected parsing error")):
        result = sanitize_url(sensitive_url)

        # The fix should ensure we return a safe placeholder
        assert result == "[redacted]"
        # And definitely shouldn't contain the secret
        assert "SUPER_SECRET_VALUE" not in result

def test_sanitize_url_normal_operation():
    """Verify standard redaction works as expected."""
    url = "https://example.com?api_key=secret123&user=john"
    result = sanitize_url(url)
    assert "secret123" not in result
    assert "john" in result
    # URL encoded [redacted] is %5Bredacted%5D
    assert "%5Bredacted%5D" in result
