from jules.serializers import ApiKeyUpdateSerializer


def test_api_key_no_limit():
    """
    Test that the current implementation accepts API keys longer than 2048 characters.
    This serves as a reproduction of the missing length validation vulnerability.
    """
    long_key = "a" * 5000
    serializer = ApiKeyUpdateSerializer(data={"api_key": long_key})

    # This should now be invalid because of the max_length=2048 limit
    assert (
        not serializer.is_valid()
    ), "Serializer should reject keys longer than 2048 characters"
    assert "API key must be at most 2048 characters." in str(
        serializer.errors["api_key"][0]
    )
