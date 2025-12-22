import pytest
from django.core.exceptions import ValidationError
from users.models import User

@pytest.mark.django_db
def test_invalid_email_behavior():
    """
    Test to verify current behavior of email validation.
    Currently, invalid emails are accepted (CharField).
    After fix, they should be rejected (EmailField).
    """
    invalid_email = "not-an-email"
    user = User(name="Test User", email=invalid_email)

    # After the fix, this SHOULD raise ValidationError because it's now an EmailField
    with pytest.raises(ValidationError) as excinfo:
        user.full_clean()

    # Optional: verify it's the email field that failed
    assert 'email' in excinfo.value.message_dict
