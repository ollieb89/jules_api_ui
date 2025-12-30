import pytest
from django.core.exceptions import ValidationError
from users.models import User

@pytest.mark.django_db
def test_invalid_email_behavior():
    """
    Test to verify that the email field correctly rejects invalid email addresses.
    The User.email field is now an EmailField, so invalid emails must raise a ValidationError.
    This test verifies the behavior after the email validation fix has been applied.
    """
    invalid_email = "not-an-email"
    user = User(name="Test User", email=invalid_email)

    # After the fix, this SHOULD raise ValidationError because it's now an EmailField
    with pytest.raises(ValidationError) as excinfo:
        user.full_clean()

    # Optional: verify it's the email field that failed
    assert 'email' in excinfo.value.message_dict
